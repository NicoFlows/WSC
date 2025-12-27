# WSC Location Schema v1.0

This document defines the standard structure for location/map files in the World State Chronicler system. Locations represent spatial geometry at various scales, from galaxies down to individual rooms.

## Design Goals

1. **Hierarchical Linking** - Every location can reference its parent (container) and children (contained locations)
2. **Entity Binding** - Locations link to WSC entities that hold game state (control, population, resources)
3. **Scale Agnostic** - Same schema works for galaxies, planets, cities, buildings, and rooms
4. **Agent Readable** - Well-documented so sub-agents can generate locations on demand
5. **Source Preservation** - Original generator data preserved in `geometry` block

## Scale Hierarchy

```
galaxy          Galactic 4X scale - sectors, arms, clusters
  └── sector    Regional grouping of star systems
      └── system    Single star system with orbital bodies
          └── body      Planet, moon, asteroid, station
              └── locale    City, settlement, installation
                  └── district   Neighborhood, deck, zone
                      └── site       Building, dungeon, cave
                          └── room     Individual chamber/space
```

## Schema Definition

```json
{
  "$schema": "wsc-location-v1",
  "id": "location.{scale}.{name}",
  "name": "Human Readable Name",
  "type": "{scale_type}",
  "scale": "{galaxy|sector|system|body|locale|district|site|room}",
  "tags": ["descriptive", "tags"],

  "hierarchy": {
    "parent": {
      "location_id": "location.{parent_scale}.{parent_name}",
      "anchor": { /* position within parent */ },
      "entity_id": "region.{parent_entity}"
    },
    "children": [
      {
        "location_id": "location.{child_scale}.{child_name}",
        "anchor": { /* position within this location */ },
        "entity_id": "{entity_type}.{child_entity}"
      }
    ]
  },

  "entity_id": "{entity_type}.{name}",

  "bounds": {
    "width": 100,
    "height": 100,
    "depth": null,
    "units": "light_years|au|km|m|ft"
  },

  "geometry": {
    "format": "{hex_grid|graph|grid|geojson|rooms|chambers}",
    "source": "{generator_name_and_version}",
    "data": { /* scale-appropriate spatial data */ }
  },

  "features": [
    {
      "id": "feature_{n}",
      "name": "Feature Name",
      "type": "{feature_type}",
      "position": { /* location-specific coords */ },
      "properties": {}
    }
  ],

  "connections": [
    {
      "id": "conn_{n}",
      "from": "{feature_id|edge}",
      "to": "{location_id|feature_id}",
      "type": "{jump_lane|road|door|passage|stairs}",
      "properties": {}
    }
  ],

  "terrain": {
    "default": "{terrain_type}",
    "atmosphere": "{none|thin|standard|dense|toxic}",
    "temperature": "{frozen|cold|temperate|hot|extreme}",
    "hazards": []
  },

  "metadata": {
    "created": "ISO timestamp",
    "generator": "agent or tool name",
    "notes": "any relevant notes",
    "suitable_agents": ["galactic-4x", "party-rpg"]
  }
}
```

## Anchor Types by Scale

Anchors specify where a child location exists within its parent:

| Parent Scale | Anchor Format | Example |
|--------------|---------------|---------|
| galaxy | `{"sector": "coreward_arm", "coords": [x,y,z]}` | System in galaxy |
| sector | `{"coords": [x,y,z]}` | System in sector |
| system | `{"orbit": 3, "body": "planet"}` | Planet in system |
| body | `{"coords": [lat,lon], "region": "northern_continent"}` | City on planet |
| locale | `{"district": "docking_bay", "coords": [x,y]}` | Building in city |
| district | `{"coords": [x,y], "feature": "warehouse_7"}` | Room in district |
| site | `{"floor": 2, "room": "library"}` | Sub-room in building |

## Geometry Formats by Scale

| Scale | Recommended Format | Description |
|-------|-------------------|-------------|
| galaxy, sector | `graph` | Nodes (systems) + edges (jump lanes) |
| system | `orbital` | Central body + orbital slots |
| body (planet) | `hex_grid` | Hex-based terrain map |
| locale (city) | `geojson` | Polygons for districts/buildings |
| locale (village) | `geojson` | Simpler polygon layout |
| district | `grid` | Regular grid with cells |
| site (dungeon) | `rooms` | Rectangles + doors + connections |
| site (building) | `floors` | Multi-floor with rooms per floor |
| site (cave) | `chambers` | Irregular chambers + passages |

## Geometry Format Specifications

### `graph` - For Galaxy/Sector Scale

```json
{
  "format": "graph",
  "data": {
    "nodes": [
      {
        "id": "vega",
        "name": "Vega System",
        "coords": {"x": 25.3, "y": -12.7, "z": 4.1},
        "properties": {"type": "binary", "importance": 0.8}
      }
    ],
    "edges": [
      {
        "id": "lane_nexus_vega",
        "from": "nexus_prime",
        "to": "vega",
        "type": "jump_lane",
        "properties": {"travel_time": 3, "stability": 0.9}
      }
    ]
  }
}
```

### `orbital` - For Star System Scale

```json
{
  "format": "orbital",
  "data": {
    "center": {
      "id": "vega_primary",
      "type": "star",
      "class": "A0V",
      "properties": {}
    },
    "orbits": [
      {
        "slot": 1,
        "distance_au": 0.4,
        "bodies": [
          {"id": "vega_i", "type": "planet", "subtype": "rocky"}
        ]
      },
      {
        "slot": 3,
        "distance_au": 2.1,
        "bodies": [
          {"id": "vega_prime", "type": "planet", "subtype": "terrestrial"},
          {"id": "vega_prime_station", "type": "station", "orbit_of": "vega_prime"}
        ]
      }
    ],
    "features": [
      {"id": "outer_belt", "type": "asteroid_belt", "distance_au": 8.5}
    ]
  }
}
```

### `hex_grid` - For Planetary/Regional Scale

```json
{
  "format": "hex_grid",
  "data": {
    "layout": "odd-q",
    "hex_size": 50,
    "hex_units": "km",
    "hexes": {
      "q5_r3": {"q": 5, "r": 3, "terrain": "forest"},
      "q5_r4": {"q": 5, "r": 4, "terrain": "hills"},
      "q6_r3": {"q": 6, "r": 3, "terrain": "water"}
    }
  }
}
```

### `geojson` - For City/Village Scale

```json
{
  "format": "geojson",
  "data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "id": "market_district",
        "properties": {"name": "Market District", "type": "commercial"},
        "geometry": {
          "type": "Polygon",
          "coordinates": [[[0,0], [100,0], [100,80], [0,80], [0,0]]]
        }
      }
    ]
  }
}
```

### `grid` - For District/Deck Scale

```json
{
  "format": "grid",
  "data": {
    "width": 20,
    "height": 15,
    "cell_size": 5,
    "cell_units": "m",
    "cells": {
      "5_3": {"terrain": "corridor"},
      "5_4": {"terrain": "room", "room_id": "cargo_bay_1"},
      "6_4": {"terrain": "room", "room_id": "cargo_bay_1"}
    }
  }
}
```

### `rooms` - For Dungeon/Structured Site Scale

```json
{
  "format": "rooms",
  "data": {
    "rects": [
      {"id": "entry_hall", "x": 0, "y": 0, "w": 4, "h": 3, "name": "Entry Hall"},
      {"id": "throne_room", "x": 2, "y": 4, "w": 6, "h": 5, "name": "Throne Room"}
    ],
    "doors": [
      {"from": "entry_hall", "to": "throne_room", "position": {"x": 2, "y": 3}, "type": "regular"}
    ],
    "features": [
      {"room": "throne_room", "type": "throne", "position": {"x": 5, "y": 7}}
    ]
  }
}
```

### `floors` - For Multi-Story Building Scale

```json
{
  "format": "floors",
  "data": {
    "floors": [
      {
        "level": 0,
        "name": "Ground Floor",
        "rooms": [
          {"id": "foyer", "name": "Foyer", "cells": [{"i": 5, "j": 0}, {"i": 5, "j": 1}]}
        ],
        "doors": [
          {"edge": {"cell": {"i": 5, "j": 1}, "dir": "n"}, "type": "regular"}
        ],
        "stairs": [
          {"cell": {"i": 7, "j": 3}, "dir": "n", "up": true}
        ]
      },
      {
        "level": 1,
        "name": "Upper Floor",
        "rooms": []
      }
    ]
  }
}
```

### `chambers` - For Natural Cave Scale

```json
{
  "format": "chambers",
  "data": {
    "chambers": [
      {
        "id": "entrance_cave",
        "name": "Entrance Cave",
        "bounds": {"x": 0, "y": 0, "w": 10, "h": 8},
        "features": ["stalactites", "pool"]
      }
    ],
    "passages": [
      {"id": "p1", "from": "entrance_cave", "to": "inner_chamber", "width": "narrow"}
    ],
    "entrances": [
      {"id": "main_entrance", "chamber": "entrance_cave", "position": {"x": 0, "y": 4}}
    ]
  }
}
```

## Entity Binding

Every location should bind to a WSC entity that tracks game state:

| Location Scale | Entity Type | State Tracked |
|----------------|-------------|---------------|
| galaxy/sector | - | Too large, use regions |
| system | region | Control, influence, resources |
| body | region or locale | Depending on detail level |
| locale | locale | Population, services, happiness |
| district | site | Function, condition, occupants |
| site | site | Ownership, contents, state |
| room | - | Usually tracked by parent site |

## Example: Complete Hierarchy

```
location.galaxy.local_cluster
  └── location.sector.coreward_reach
      ├── location.system.nexus_prime     → entity: region.nexus_prime
      │   ├── location.body.nexus_prime   → entity: region.nexus_prime
      │   │   └── location.locale.port_nexus → entity: locale.port_nexus
      │   │       ├── location.district.docking_bay_7 → entity: site.docking_bay_7
      │   │       │   └── location.site.zaras_shop → entity: site.zaras_shop
      │   │       └── location.district.command_sector → entity: site.command_center
      │   └── location.body.nexus_station → entity: locale.garrison_alpha
      └── location.system.vega            → entity: region.vega
          └── location.body.vega_prime    → entity: feature.vega_prime
              └── location.locale.contested_outpost → entity: locale.contested
```

## Sub-Agent Generation Guidelines

When generating locations, agents should:

1. **Determine Scale** - What level of detail is needed?
2. **Choose Geometry Format** - Match format to scale (see table above)
3. **Establish Hierarchy** - Set parent link, prepare for children
4. **Bind Entity** - Create or reference WSC entity for state
5. **Generate Features** - Appropriate detail for the scale
6. **Define Connections** - How does this connect to other locations?

### Generation Prompts by Scale

**Galaxy/Sector**: "Generate a sector with N star systems, considering strategic chokepoints and resource distribution."

**System**: "Generate a star system with primary star type X, N planets, notable features like belts or stations."

**Locale (City)**: "Generate a city/station with population N, districts for [purposes], suitable for [faction]."

**Site (Dungeon)**: "Generate an explorable location with N rooms, theme X, suitable for [encounter type]."

**Site (Building)**: "Generate a M-story building with purpose X, notable rooms including [list]."
