import dotenv from "dotenv";
import express from "express";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const startup_prisma = new PrismaClient();
const startup = express();
startup.use(express.json());
startup.get("/startups", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || "";
    const sortOrder = req.query.sortOrder === "desc" ? "desc" : "asc";

    const offset = (page - 1) * limit;
    
    const keywordInput = req.query.keyword;
    let searchQuery = {};

    if (Array.isArray(keywordInput)) {
      searchQuery = { name: { in: keywordInput } }; 
    } else if (typeof keywordInput === 'string' && keywordInput) {
      searchQuery = { name: { contains: keywordInput } };
    }

    let orderBy = {};
    if (sortBy === "actualInvest") {
      orderBy = { actualInvest: sortOrder };
    } else if (sortBy === "simInvest") {
      orderBy = { simInvest: sortOrder };
    } else if (sortBy === "employees") {
      orderBy = { employees: sortOrder };
    } else if (sortBy === "revenue") {
      orderBy = { revenue: sortOrder };
    } else if (sortBy === "count") {
      orderBy = { count: sortOrder };
    } else if (sortBy === "category") {
      orderBy = { category: sortOrder };
    } else if (sortBy === "createdAt") {
      orderBy = { createdAt: sortOrder };
    } else if (sortBy === "updatedAt") {
      orderBy = { updatedAt: sortOrder };
    }

    const startups = await startup_prisma.startup.findMany({
      where: searchQuery,
      skip: offset,
      take: limit,
      orderBy: orderBy,

      include: {
        investments: true /** 투자자 목록도 가지고옴 필요 없다 생각하면 삭제할 예정 */,
      },
    });

    const totalStartup = await startup_prisma.startup.count({
      where: searchQuery,
    });
    const totalPages = Math.ceil(totalStartup / limit);

    res.status(200).send({
      data: startups,
      meta: {
        total: totalStartup,
        page: page,
        limit: limit,
        totalPages: totalPages,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

startup.get("/startups/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const startup = await startup_prisma.startup.findUnique({
      where: { id },
    });

    if (startup) {
      await startup_prisma.startup.update({
        where: { id },
        data: {
          count: {
            increment: 1,
          },
        },
      });
    }

    res.status(200).send(startup);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

startup.post("/startups", async (req, res) => {
  try {
    const {
      name,
      actualInvest,
      simInvest,
      employees,
      revenue,
      description,
      count,
      category,
    } = req.body;

    const startup = await startup_prisma.startup.create({
      data: {
        name,
        actualInvest,
        simInvest,
        employees,
        revenue,
        description,
        count,
        category,
      },
    });
    res.status(200).send(startup);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

startup.patch("/startups/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      actualInvest,
      simInvest,
      employees,
      revenue,
      description,
      count,
      category,
    } = req.body;
    const startup = await startup_prisma.startup.update({
      where: { id },
      data: {
        name,
        actualInvest,
        simInvest,
        employees,
        revenue,
        description,
        count,
        category,
      },
    });
    res.status(200).send(startup);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

startup.delete("/startups/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const startup = await startup_prisma.startup.delete({ where: { id } });
    res.status(200).send(startup);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

export default startup;
