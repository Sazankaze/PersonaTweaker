function genId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export const PatchType = z.enum(['append', 'prepend', 'delete', 'replace']);
export type PatchType = z.infer<typeof PatchType>;

export const PatchOperation = z.object({
  id: z.string().default(() => genId()),
  type: PatchType,
  enabled: z.boolean().default(true),
  value: z.string().default(''),
  replacement: z.string().optional().default(''),
  use_regex: z.boolean().default(false),
  label: z.string().optional().default(''),
});
export type PatchOperation = z.infer<typeof PatchOperation>;

export const LibraryEntry = z.object({
  id: z.string().default(() => genId()),
  name: z.string().default(''),
  description: z.string().optional().default(''),
  patch: PatchOperation,
});
export type LibraryEntry = z.infer<typeof LibraryEntry>;

export const BoundPatch = z.discriminatedUnion('source', [
  z.object({ source: z.literal('inline'), patch: PatchOperation }),
  z.object({ source: z.literal('library'), entry_id: z.string(), enabled: z.boolean().default(true) }),
]);
export type BoundPatch = z.infer<typeof BoundPatch>;

export const BindingConfig = z.object({
  patches: z.array(BoundPatch).default([]),
});
export type BindingConfig = z.infer<typeof BindingConfig>;

const ScriptConfigSchema = z.object({
  library: z.array(LibraryEntry).default([]),
  characters: z.record(z.string(), BindingConfig).default({}),
  chats: z.record(z.string(), BindingConfig).default({}),
});
export const ScriptConfig = {
  parse(data: unknown) {
    try {
      return ScriptConfigSchema.parse(data);
    } catch {
      return ScriptConfigSchema.parse({});
    }
  },
};
export type ScriptConfig = z.infer<typeof ScriptConfigSchema>;
