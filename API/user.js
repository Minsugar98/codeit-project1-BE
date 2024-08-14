import dotenv from "dotenv";
import express from "express";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const user_prisma = new PrismaClient();
const user = express();
user.use(express.json());

user.get("/startup/:id/user", async (req, res) => {
  try {
    const { id } = req.params;
    const users = await user_prisma.user.findMany({
      where: { startupId: id },
    });
    res.status(200).send(users);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

user.post("/startup/:id/user", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, InvestAmount, comment, password } = req.body;

    const [user, updatedStartup] = await user_prisma.$transaction([
      user_prisma.user.create({
        data: {
          startupId: id,
          name,
          InvestAmount,
          comment,
          password,
        },
      }),
      user_prisma.startup.update({
        where: {
          id: id,
        },
        data: {
          simInvest: {
            increment: InvestAmount,
          },
        },
      }),
    ]);

    res.status(200).send({ user, updatedStartup });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

user.patch("/user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const existingUser = await user_prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).send({ error: "User not found" });
    }

    const { name, InvestAmount, comment, password } = req.body;

    const difference = InvestAmount - existingUser.InvestAmount;

    const user = await user_prisma.user.update({
      where: { id },
      data: { name, InvestAmount, comment, password },
    });

    if (difference > 0) {
      await user_prisma.startup.update({
        where: {
          id: existingUser.startupId,
        },
        data: {
          simInvest: {
            increment: difference,
          },
        },
      });
    } else if (difference < 0) {
      await user_prisma.startup.update({
        where: {
          id: existingUser.startupId,
        },
        data: {
          simInvest: {
            decrement: -difference,
          },
        },
      });
    }

    res.status(200).send(user);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

user.delete("/user/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const userToDelete = await user_prisma.user.findUnique({
      where: { id },
      select: { InvestAmount: true, startupId: true },
    });

    if (!userToDelete) {
      return res.status(404).send({ error: "User not found" });
    }

    const user = await user_prisma.user.delete({
      where: { id },
    });

    await user_prisma.startup.update({
      where: {
        id: userToDelete.startupId,
      },
      data: {
        simInvest: {
          decrement: userToDelete.InvestAmount, // 투자 금액만큼 감소
        },
      },
    });

    res.status(200).send(user);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

user.listen(3000, () => {
  console.log("Server is running");
});
