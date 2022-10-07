import fs from 'fs'

const streets = JSON.parse(fs.readFileSync('./resources/streets.geojson'))

const map = streets.features.reduce((map, feature) => {
  if (feature.properties.name === null) {
    return map
  }

  if (map.has(feature.properties.name)) {
    const item = map.get(feature.properties.name)
    item.geometry.push(feature.geometry)
    map.set(feature.properties.name, item)
    return map
  }

  map.set(feature.properties.name, {
    name: feature.properties.name,
    lowercase_name: feature.properties.name.toLowerCase(),
    geometry: [ feature.geometry ],
  })

  return map
}, new Map)

fs.writeFileSync('./public/streets.geojson', JSON.stringify(Object.fromEntries(map), null, 2))