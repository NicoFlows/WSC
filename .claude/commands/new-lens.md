Scaffold a new WSC gameplay lens based on "$ARGUMENTS".

Expected argument format: `<lens_name> [--scale <scale>]`
Scale options: grand | regional | locale | scene | embodied
Examples:
- `trading --scale regional`
- `diplomacy --scale grand`
- `heist --scale scene`

Follow these steps:

1. **Define the lens scope:**
   - What entities does it operate on?
   - What zoom level (Grand Strategy → Embodied)?
   - What authority does it have over world state?

2. **Generate the Lens class with:**

```typescript
interface <LensName>Lens extends Lens {
  // Lens metadata
  id: string;
  scale: 'grand' | 'regional' | 'locale' | 'scene' | 'embodied';

  // Entity scope
  entity_types: EntityType[];

  // AI capabilities
  ai_contract: LensAIContract;

  // Core methods
  expand(context: ExpandContext): Promise<Instance>;
  summarize(result: InstanceResult): Promise<SummarizeResult>;
}
```

3. **Define expand() behavior:**
   - What world state does it read?
   - What instance state does it create?
   - How does it instantiate detail (NPCs, map, etc.)?

4. **Define summarize() behavior:**
   - What events can it emit?
   - What world patches does it produce?
   - How does it calculate importance?

5. **Define AI decision points:**
   - When does AI get invoked?
   - What entity types participate?
   - What fallback behavior exists?

6. **Output:**
   - TypeScript interface/class skeleton
   - Event types this lens can emit
   - AI decision points configuration
   - Example expand/summarize flow
   - Integration test scenarios

7. **Document handoff behavior:**
   - What triggers drill-down into this lens?
   - What events propagate up to parent lens?
   - How does it interact with adjacent lenses?
