import type {
  RepositoryMetadata,
  TrendingRepositorySeed,
} from "@/lib/snapshots/types";

const README_EXCERPT_LIMIT = 3000;

export interface RepositoryUpsertPayload {
  githubRepoId: number;
  owner: string;
  name: string;
  fullName: string;
  githubUrl: string;
  description: string | null;
  primaryLanguage: string | null;
  starsTotal: number | null;
  forksTotal: number | null;
  defaultBranch: string | null;
  avatarUrl: string | null;
}

export interface SnapshotItemInsertPayload {
  snapshotId: string;
  repositoryId: string;
  rank: number;
  starsToday: number | null;
  repoDescriptionSnapshot: string | null;
  readmeExcerpt: string | null;
  summaryKo: string;
}

function normalizeNullableText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function serializeRepositoryForUpsert(
  seed: TrendingRepositorySeed,
  repository: RepositoryMetadata,
): RepositoryUpsertPayload {
  return {
    githubRepoId: repository.githubRepoId,
    owner: seed.owner,
    name: seed.name,
    fullName: seed.fullName,
    githubUrl: repository.githubUrl ?? `https://github.com/${seed.repositoryPath}`,
    description: normalizeNullableText(repository.description),
    primaryLanguage: normalizeNullableText(repository.primaryLanguage),
    starsTotal: repository.starsTotal,
    forksTotal: repository.forksTotal,
    defaultBranch: normalizeNullableText(repository.defaultBranch),
    avatarUrl: normalizeNullableText(repository.avatarUrl),
  };
}

export function serializeReadmeExcerpt(readme: string | null): string | null {
  const normalized = normalizeNullableText(readme);
  if (!normalized) {
    return null;
  }

  return normalized.slice(0, README_EXCERPT_LIMIT);
}

export function serializeSnapshotItemForInsert(input: {
  snapshotId: string;
  repositoryId: string;
  seed: TrendingRepositorySeed;
  repository: RepositoryMetadata;
  readme: string | null;
  summaryKo: string;
}): SnapshotItemInsertPayload {
  return {
    snapshotId: input.snapshotId,
    repositoryId: input.repositoryId,
    rank: input.seed.rank,
    starsToday: input.seed.starsToday,
    repoDescriptionSnapshot: normalizeNullableText(input.repository.description),
    readmeExcerpt: serializeReadmeExcerpt(input.readme),
    summaryKo: input.summaryKo.trim(),
  };
}
