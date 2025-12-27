Run a tactical combat encounter using the party-rpg sub-agent (Baldur's Gate 3 style).

**Arguments**: $ARGUMENTS (required)
- Opportunity ID: `opp_battle_042`
- Or encounter description: `"Dogfight: Raiders vs Hegemony patrol in the belt"`

**Examples**:
- `/run-combat "Convoy interdiction at Waypoint Sigma"`
- `/run-combat "Kai duels a Hegemony ace"`
- `/run-combat "Party ambushed by bandits on the road"`
- `/run-combat "Siege of the eastern fortress"`
- `/run-combat opp_battle_042`

This command invokes the `party-rpg` sub-agent in combat mode, simulating Baldur's Gate 3 / Divinity: Original Sin style tactical combat:

**Combat System:**
- Initiative and turn order
- Positioning and terrain advantages
- Skills, spells, and special abilities
- Status effects and conditions
- Victory, defeat, and retreat options

**Turn Structure:**
```
ROUND 1:
┌─ CHARACTER'S TURN ─────────────────────────┐
│ HP: 45/45 | Position: Behind cover         │
│ Available Actions:                          │
│ [ATTACK] Primary weapon attack             │
│ [ABILITY] Special ability or spell         │
│ [MOVE] Reposition on battlefield           │
│ [ITEM] Use consumable                      │
│ [DIALOGUE] Intimidate or negotiate         │
└────────────────────────────────────────────┘
```

**Combat Resolution:**
1. Sets up encounter with terrain and positioning
2. Rolls initiative for all participants
3. Processes turns with actions and reactions
4. Narrates action cinematically with consequences
5. Emits events (combat.started, combat.resolved, death.occurred)
6. Updates force strength, damage, casualties

Use this to generate exciting tactical encounters with real consequences.
