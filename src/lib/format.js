export const eraYears = (era) => `${era.startYear}–${era.endYear ?? "Today"}`;
export const mediaUrl = (item) => `/media/${item.file}`;
