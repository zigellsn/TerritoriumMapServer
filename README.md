# TerritoriumMakeStyle

Run Style-Container with
``` bash
docker run --mount type=bind,source="$(pwd)"/output,target=/output <style container name>
```

Manual steps
``` bash
wget https://tile.openstreetmap.de/shapefiles/river-polygons-reduced-3857.zip
wget https://tile.openstreetmap.de/shapefiles/lakes-polygons-reduced-3857.zip
wget https://tile.openstreetmap.de/shapefiles/ocean-polygons-reduced-3857.zip
```