Run WSC world simulation using the orchestrator sub-agent.

**Arguments**: $ARGUMENTS
- `init` - Initialize world from examples
- `--ticks N` - Run N ticks of simulation (default: 1)
- `--scale [galactic|continental|city]` - Primary simulation scale
- `status` - Show current world state
- `history` - Show recent chronicle events

**Examples**:
- `/run-simulation init` - Set up world state from examples
- `/run-simulation --ticks 5 --scale galactic` - Simulate 5 galactic turns
- `/run-simulation --ticks 3 --scale continental` - Simulate 3 civilization turns
- `/run-simulation status` - Check current state
- `/run-simulation history` - See what happened

This command invokes the `wsc-orchestrator` sub-agent which:
1. Manages the world clock and state.json
2. Runs the appropriate genre agent based on scale:
   - `galactic-4x` - Sins of a Solar Empire style (empires, fleets, systems)
   - `continental-strategy` - Civilization style (nations, armies, territory)
   - `city-builder` - Cities: Skylines style (infrastructure, services, growth)
3. Dispatches `party-rpg` agent for character-level drill-downs (Baldur's Gate 3 style)
4. Validates consistency after each tick

Use this to generate synthetic world data without building actual game UIs.
