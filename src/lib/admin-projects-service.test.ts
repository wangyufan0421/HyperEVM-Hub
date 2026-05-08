import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createProjectService,
  mapProjectFormToCreateInput,
  mapProjectFormToUpdateInput,
} from "./admin-projects-service";

type Row = Record<string, unknown> & {
  id: string;
  slug: string;
  isDeleted?: boolean;
  deletedAt?: Date | null;
};

let lastUpdateData: Record<string, unknown> | null = null;

function makeRepo() {
  const store = new Map<string, Row>();
  lastUpdateData = null;

  return {
    project: {
      findUnique: async ({ where }: { where: { id?: string; slug?: string } }) => {
        if (where.id) return store.get(where.id) ?? null;
        if (where.slug) return [...store.values()].find((p) => p.slug === where.slug) ?? null;
        return null;
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const id = `p_${store.size + 1}`;
        const row = { id, ...data, createdAt: new Date(), updatedAt: new Date(), deletedAt: null };
        store.set(id, row);
        return row;
      },
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        lastUpdateData = data;
        const current = store.get(where.id);
        const next = { ...current, ...data, updatedAt: new Date() };
        store.set(where.id, next);
        return next;
      },
    },
    _store: store,
  };
}

describe("admin projects service", () => {
  it("新增项目会写入数据库并保留必填字段", async () => {
    const repo = makeRepo();
    const service = createProjectService(repo as never);

    const created = await service.createProject(
      mapProjectFormToCreateInput({
        name: "HyperLend",
        slug: "hyperlend",
        category: "DeFi",
        status: "Live",
        shortDescription: "desc",
        websiteUrl: "https://example.com",
        logoFile: "/uploads/logos/hyperlend-1710000000000.png",
      }),
    );

    assert.equal(created.name, "HyperLend");
    assert.equal(created.slug, "hyperlend");
    assert.equal(created.logoFile, "/uploads/logos/hyperlend-1710000000000.png");
  });

  it("创建项目时 slug 冲突会抛出业务错误", async () => {
    const repo = makeRepo();
    const service = createProjectService(repo as never);

    await service.createProject(
      mapProjectFormToCreateInput({
        name: "A",
        slug: "dup",
        autoResolveSlug: false,
        category: "DeFi",
        status: "Live",
        shortDescription: "desc",
        websiteUrl: "https://a.com",
      }),
    );

    await assert.rejects(
      () => service.createProject(
        mapProjectFormToCreateInput({
          name: "B",
          slug: "dup",
          autoResolveSlug: false,
          category: "DEX",
          status: "Live",
          shortDescription: "desc",
          websiteUrl: "https://b.com",
        }),
      ),
      (error: unknown) => {
        assert.equal(error instanceof Error, true);
        assert.equal((error as Error).message, "slug 已存在，请修改项目名或手动填写一个新的 slug。");
        return true;
      },
    );
  });

  it("编辑项目时 slug 冲突会抛出业务错误", async () => {
    const repo = makeRepo();
    const service = createProjectService(repo as never);

    const first = await service.createProject(
      mapProjectFormToCreateInput({
        name: "A",
        slug: "a",
        category: "DeFi",
        status: "Live",
        shortDescription: "desc",
        websiteUrl: "https://a.com",
      }),
    );

    const second = await service.createProject(
      mapProjectFormToCreateInput({
        name: "B",
        slug: "b",
        category: "DEX",
        status: "Live",
        shortDescription: "desc",
        websiteUrl: "https://b.com",
      }),
    );

    await assert.rejects(
      () => service.updateProject(
        second.id,
        mapProjectFormToUpdateInput({
          name: second.name as string,
          slug: first.slug as string,
          category: second.category as string,
          status: second.status as string,
          shortDescription: second.shortDescription as string,
          websiteUrl: second.websiteUrl as string,
        }),
      ),
      (error: unknown) => {
        assert.equal(error instanceof Error, true);
        assert.equal((error as Error).message, "slug 已存在，请修改项目名或手动填写一个新的 slug。");
        return true;
      },
    );
  });

  it("空分类会被拒绝", () => {
    assert.throws(
      () => mapProjectFormToCreateInput({
        name: "A",
        slug: "a",
        category: "",
        categories: "",
        status: "Live",
        shortDescription: "desc",
        websiteUrl: "https://a.com",
      }),
      (error: unknown) => {
        assert.equal(error instanceof Error, true);
        assert.equal((error as Error).message.includes("项目分类至少选择一个"), true);
        return true;
      },
    );
  });

  it("自动生成 slug 冲突时会自动追加后缀", async () => {
    const repo = makeRepo();
    const service = createProjectService(repo as never);

    await service.createProject(
      mapProjectFormToCreateInput({
        name: "PRJX",
        slug: "",
        autoResolveSlug: true,
        category: "DeFi",
        status: "Live",
        shortDescription: "desc",
        websiteUrl: "https://a.com",
      }),
    );

    const created = await service.createProject(
      mapProjectFormToCreateInput({
        name: "PRJX",
        slug: "",
        autoResolveSlug: true,
        category: "DEX",
        status: "Live",
        shortDescription: "desc",
        websiteUrl: "https://b.com",
      }),
    );

    assert.equal(created.slug, "prjx-2");
  });

  it("create 输入无协议链接时会自动补全 https", () => {
    const created = mapProjectFormToCreateInput({
      name: "HyperLend",
      slug: "hyperlend",
      category: "DeFi",
      status: "Live",
      shortDescription: "desc",
      websiteUrl: " example.com ",
      twitterUrl: " x.com/hyperlend ",
      discordUrl: "discord.gg/hyperlend ",
      docsUrl: " docs.hyperlend.xyz ",
    });

    assert.equal(created.websiteUrl, "https://example.com");
    assert.equal(created.twitterUrl, "https://x.com/hyperlend");
    assert.equal(created.discordUrl, "https://discord.gg/hyperlend");
    assert.equal(created.docsUrl, "https://docs.hyperlend.xyz");
  });

  it("update 输入已带协议链接时保持原样并去掉空格", () => {
    const updated = mapProjectFormToUpdateInput({
      name: "HyperLend",
      slug: "hyperlend",
      category: "DeFi",
      status: "Live",
      shortDescription: "desc",
      websiteUrl: "  https://example.com/path  ",
      twitterUrl: "  http://x.com/hyperlend  ",
      discordUrl: "",
      docsUrl: "   ",
    });

    assert.equal(updated.websiteUrl, "https://example.com/path");
    assert.equal(updated.twitterUrl, "http://x.com/hyperlend");
    assert.equal(updated.discordUrl, null);
    assert.equal(updated.docsUrl, null);
  });

  it("编辑项目会更新字段", async () => {
    const repo = makeRepo();
    const service = createProjectService(repo as never);
    const created = await service.createProject(
      mapProjectFormToCreateInput({
        name: "A",
        slug: "a",
        category: "DeFi",
        status: "Live",
        shortDescription: "desc",
        websiteUrl: "https://a.com",
      }),
    );

    const updated = await service.updateProject(
      created.id,
      mapProjectFormToUpdateInput({
        name: "B",
        slug: "b",
        category: "DEX",
        categories: "DEX;DeFi",
        status: "Beta",
        shortDescription: "new",
        websiteUrl: "https://b.com",
        logoFile: "/uploads/logos/b-1710000000000.webp",
        targetUsers: "Trader\nLP",
        riskNotes: "Smart contract risk",
      }),
    );

    assert.equal(updated.name, "B");
    assert.equal(updated.slug, "b");
    assert.equal(updated.logoFile, "/uploads/logos/b-1710000000000.webp");
    assert.deepEqual(updated.categories, ["DEX", "DeFi"]);
    assert.deepEqual(updated.targetUsers, ["Trader", "LP"]);
    assert.deepEqual(updated.riskNotes, ["Smart contract risk"]);
  });

  it("update 只写入 schema 已有字段", async () => {
    const repo = makeRepo();
    const service = createProjectService(repo as never);
    const created = await service.createProject(
      mapProjectFormToCreateInput({
        name: "A",
        slug: "a",
        category: "DeFi",
        status: "Live",
        shortDescription: "desc",
        websiteUrl: "https://a.com",
      }),
    );

    await service.updateProject(
      created.id,
      mapProjectFormToUpdateInput({
        name: "B",
        slug: "b",
        category: "DEX",
        categories: "DEX;HIP-3",
        status: "Beta",
        shortDescription: "new",
        websiteUrl: "https://b.com",
      }),
    );

    assert.ok(lastUpdateData);
    assert.equal("autoResolveSlug" in (lastUpdateData as Record<string, unknown>), false);
    assert.equal("categories" in (lastUpdateData as Record<string, unknown>), true);
    assert.equal("tags" in (lastUpdateData as Record<string, unknown>), true);
    assert.equal(lastUpdateData?.categories, "[\"DEX\",\"HIP-3\"]");
  });

  it("旧项目仅有 category 时会回填 categories", async () => {
    const repo = makeRepo();
    const legacyId = "legacy_1";
    repo._store.set(legacyId, {
      id: legacyId,
      name: "Legacy",
      slug: "legacy",
      category: "DeFi",
      categories: "[]",
      status: "Live",
      shortDescription: "legacy",
      websiteUrl: "https://legacy.com",
      coreFeatures: "[]",
      targetUsers: "[]",
      riskNotes: "[]",
      tags: "[]",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    const service = createProjectService(repo as never);

    const project = await service.getProjectById(legacyId);
    assert.deepEqual(project?.categories, ["DeFi"]);
  });

  it("软删除会设置 isDeleted 和 deletedAt", async () => {
    const repo = makeRepo();
    const service = createProjectService(repo as never);
    const created = await service.createProject(
      mapProjectFormToCreateInput({
        name: "A",
        slug: "a",
        category: "DeFi",
        status: "Live",
        shortDescription: "desc",
        websiteUrl: "https://a.com",
      }),
    );

    const deleted = await service.softDelete(created.id);
    assert.equal(deleted.isDeleted, true);
    assert.equal(deleted.deletedAt instanceof Date, true);
  });

  it("恢复会清空 deletedAt", async () => {
    const repo = makeRepo();
    const service = createProjectService(repo as never);
    const created = await service.createProject(
      mapProjectFormToCreateInput({
        name: "A",
        slug: "a",
        category: "DeFi",
        status: "Live",
        shortDescription: "desc",
        websiteUrl: "https://a.com",
      }),
    );

    await service.softDelete(created.id);
    const restored = await service.restore(created.id);
    assert.equal(restored.isDeleted, false);
    assert.equal(restored.deletedAt, null);
  });
});
