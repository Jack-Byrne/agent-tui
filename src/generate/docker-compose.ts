import fs from "fs-extra";
import { join } from "pathe";
import type { ScaffoldAnswers } from "../schema.js";

const COMPOSE = `services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: agent
    ports:
      - "5432:5432"
    volumes:
      - agent_pgdata:/var/lib/postgresql/data

volumes:
  agent_pgdata:
`;

/** Writes docker-compose.yml only when the wizard chose Docker Postgres bootstrap. */
export async function writeDockerComposeIfNeeded(
  projectDir: string,
  answers: ScaffoldAnswers,
): Promise<void> {
  if (!answers.useSqlDatabase || answers.sqlBootstrap !== "docker_postgres") {
    return;
  }
  await fs.writeFile(join(projectDir, "docker-compose.yml"), COMPOSE, "utf8");
}
