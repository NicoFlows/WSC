Run a character scene using the party-rpg sub-agent (Baldur's Gate 3 style).

**Arguments**: $ARGUMENTS (required)
- Opportunity ID: `opp_negotiation_042`
- Or scene description: `"Reva meets Zara to negotiate for intel"`

**Examples**:
- `/run-scene "Captain Reva confronts Admiral Chen via comms"`
- `/run-scene "Kai and Reva discuss the cost of leadership"`
- `/run-scene "City council debates the zoning controversy"`
- `/run-scene opp_intel_deal_015`

This command invokes the `party-rpg` sub-agent which simulates Baldur's Gate 3 / Divinity: Original Sin style gameplay:

**Dialogue System:**
- Branching conversation trees with multiple options
- Skill checks: Persuasion, Intimidation, Deception, Insight
- Origin/background-specific dialogue options
- Companion interjections and approval reactions

**Party Dynamics:**
- Companion approval tracking (+/- based on choices)
- Personal quests and backstory moments
- Romance and rivalry progression

**Scene Resolution:**
1. Loads participating agent entities and their AI blocks
2. Establishes scene with atmosphere and stakes
3. Presents dialogue options with skill check DCs
4. Resolves checks and tracks consequences
5. Emits events to chronicle (dialogue.occurred, choice.made, approval.changed)
6. Updates relationships, memories, and world state

Use this to generate rich character interactions with meaningful consequences.
