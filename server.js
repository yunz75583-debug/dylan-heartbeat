require("dotenv").config();

const Fastify = require("fastify");
const fs = require("fs-extra");

const DEFAULT_BODY_LIMIT_MB = 50;

function readBodyLimitBytes() {
 const configured = Number(process.env.REQUEST_BODY_LIMIT_MB);
 const mb = Number.isFinite(configured) 