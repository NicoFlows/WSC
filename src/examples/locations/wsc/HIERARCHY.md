# WSC Location Hierarchy - Vega Conflict Example

This folder contains a complete hierarchical chain of locations from galaxy scale down to individual rooms, demonstrating the WSC location schema.

## Full Hierarchy

```
location.galaxy.local_cluster                    [galaxy.local_cluster.json]
│   Scale: 500 light years
│   Agent: galactic-4x
│
└── location.sector.coreward_reach               [sector.coreward_reach.json]
    │   Scale: 100 light years
    │   Agent: galactic-4x
    │   Contains: 4 star systems
    │
    └── location.system.vega                     [system.vega.json]
        │   Scale: 40 AU
        │   Agent: galactic-4x, action-sim
        │   Entity: region.vega
        │   Contains: Binary star, 4 planets, 2 belts
        │
        └── location.body.vega_station           [body.vega_station.json]
            │   Scale: 2.5 km
            │   Agent: city-builder, party-rpg, action-sim
            │   Entity: locale.port_nexus
            │   Contains: 6 station sections
            │
            └── location.locale.port_nexus       [locale.port_nexus.json]
                │   Scale: 800 x 600 m
                │   Agent: city-builder, party-rpg
                │   Entity: locale.port_nexus
                │   Contains: 5 districts
                │
                └── location.district.docking_bay_7  [district.docking_bay_7.json]
                    │   Scale: 80 x 60 m
                    │   Agent: party-rpg, action-sim
                    │   Entity: site.docking_bay_7
                    │   Contains: Landing pad, shops, control booth
                    │
                    └── location.site.zaras_shop     [site.zaras_shop.json]
                        │   Scale: 10 x 8 m
                        │   Agent: party-rpg
                        │   Entity: site.zaras_shop
                        │   Contains: Shop floor, counter, back room
                        │
                        └── location.room.zaras_back_room  [room.zaras_back_room.json]
                                Scale: 3 x 5 m
                                Agent: party-rpg
                                Contains: Intel terminal, safe, escape hatch
```

## Hierarchy Links Verification

| Location | Parent Link | Children Links |
|----------|-------------|----------------|
| galaxy.local_cluster | null (top) | sector.coreward_reach, (2 others) |
| sector.coreward_reach | galaxy.local_cluster | system.vega, system.nexus_prime, (2 others) |
| system.vega | sector.coreward_reach | body.vega_prime, body.vega_station, body.outer_belt |
| body.vega_station | system.vega | locale.port_nexus |
| locale.port_nexus | body.vega_station | district.docking_bay_7, (2 others) |
| district.docking_bay_7 | locale.port_nexus | site.zaras_shop, site.bay_7_control |
| site.zaras_shop | district.docking_bay_7 | room.zaras_back_room |
| room.zaras_back_room | site.zaras_shop | null (bottom) |

## Entity Bindings

| Location | Entity ID | Entity Type |
|----------|-----------|-------------|
| system.vega | region.vega | Region (contested system) |
| body.vega_station | locale.port_nexus | Locale (station) |
| locale.port_nexus | locale.port_nexus | Locale (same) |
| district.docking_bay_7 | site.docking_bay_7 | Site |
| site.zaras_shop | site.zaras_shop | Site |

## Scale Progression

| Scale | Units | Typical Size | Geometry Format |
|-------|-------|--------------|-----------------|
| galaxy | light_years | 500 ly | graph |
| sector | light_years | 100 ly | graph |
| system | au | 40 au | orbital |
| body | km | 2.5 km | graph |
| locale | m | 800 m | geojson |
| district | m | 80 m | grid |
| site | m | 10 m | rooms |
| room | m | 3 m | rooms |

## Agent Applicability

| Agent | Scales |
|-------|--------|
| galactic-4x | galaxy, sector, system |
| continental-strategy | (use for planetary surface) |
| city-builder | body (stations), locale |
| party-rpg | locale, district, site, room |
| action-sim | system (space combat), body, district, site |

## Navigation Example

**Drill-down path for "Scene: Reva meets Zara":**

1. `galactic-4x` identifies Vega system as contested (region.vega)
2. Zoom to `system.vega` → Reva's ship at Port Nexus
3. Zoom to `locale.port_nexus` → Docking Bay 7
4. Zoom to `district.docking_bay_7` → Wandering Star at pad, Zara's shop nearby
5. Zoom to `site.zaras_shop` → Scene location established
6. `party-rpg` runs dialogue scene using shop layout
7. If deal goes bad → `room.zaras_back_room` becomes relevant (escape hatch!)

**Bubble-up path for "Battle results affect strategy":**

1. `action-sim` resolves dogfight in system.vega outer belt
2. Results: Hegemony patrol destroyed, Free Traders win
3. Update `region.vega` influence values
4. `galactic-4x` picks up changed influence in next tick
5. Strategic implications ripple through sector

## Cross-References to Entities

These locations reference the following entity files (in `src/examples/entities/`):

- `region.vega.json` - System control and influence
- `locale.port_nexus.json` - Station state
- `site.docking_bay_7.json` - Bay state
- `agent.zara.json` - Shop owner
- `holding.wandering_star.json` - Ship at pad
- `force.hegemony_7th_fleet.json` - Patrols this system
