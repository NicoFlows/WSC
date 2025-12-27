Run an action/combat encounter using the action-sim sub-agent (Elite Dangerous style).

**Arguments**: $ARGUMENTS (required)
- Opportunity ID: `opp_dogfight_042`
- Or encounter description: `"Dogfight: Raiders vs Hegemony patrol in the belt"`

**Examples**:
- `/run-action "Wandering Star ambushed by Hegemony interceptors"`
- `/run-action "Kai infiltrates Garrison Alpha on foot"`
- `/run-action "SRV chase across planetary surface"`
- `/run-action "Capital ship engagement at jump point"`
- `/run-action opp_convoy_raid_015`

This command invokes the `action-sim` sub-agent which simulates Elite Dangerous / Star Citizen style action gameplay:

**Ship Combat:**
- Dogfighting maneuvers (jousting, reverski, FA-off)
- Power distribution (pips to SYS/ENG/WEP)
- Module damage and heat management
- Wing tactics and formation fighting

**FPS Combat:**
- Cover-based shooting mechanics
- Stealth and detection systems
- Suit systems (shields, O2, energy)
- Tactical movement options

**Vehicle Operations:**
- SRV/rover planetary exploration
- Tank and mech combat
- Atmospheric flight dynamics

**Combat Resolution:**
1. Establishes tactical situation and forces
2. Presents action options with skill checks
3. Simulates physics-based combat outcomes
4. Narrates action cinematically (cockpit experience)
5. Tracks damage, ammunition, module status
6. Emits events (combat.initiated, damage.dealt, kill.achieved)
7. Updates vehicle/character state and relationships

Use this for visceral real-time action sequences with meaningful consequences.
