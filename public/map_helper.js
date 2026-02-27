/**
 * タイルやコントロールなどを初期化します。
 *
 * @param leaflet Leaflet 本体
 * @param map 地図インスタンス
 * @param overlays オーバーレイ構成
 */
const initMap = (leaflet, map, overlays) => {
  const tileLayers = [];
  tileLayers[0] = leaflet.tileLayer("https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png", {
    attribution:
      "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>地理院タイル</a>",
  });
  tileLayers[1] = leaflet.tileLayer(
    "https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg",
    {
      attribution:
        "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>地理院タイル</a>",
    },
  );
  tileLayers[2] = leaflet.tileLayer("https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}", {
    attribution:
      "<a href='https://developers.google.com/maps/documentation' target='_blank'>Google Maps</a>",
  });
  tileLayers[3] = leaflet.tileLayer(
    "http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    {
      attribution: 'Tiles &copy; <a href="http://www.esrij.com/"> Esri Japan </a>',
    },
  );
  tileLayers[2].addTo(map); // Google マップをデフォルトにする
  leaflet.control
    .layers(
      {
        "国土地理院 標準地図": tileLayers[0],
        "国土地理院 写真": tileLayers[1],
        "Google マップ": tileLayers[2],
        "Esri 地形図": tileLayers[3],
      },
      overlays,
    )
    .addTo(map);
};

/**
 * マーカー一覧をマップに配置します。
 *
 * @param leaflet Leaflet 本体
 * @param overlay 配置対象の地図またはオーバーレイ
 * @param iconMarkers IconMarkers インスタンス
 * @param markers マーカー一覧
 */
const setMarkers = (leaflet, overlay, iconMarkers, markers) => {
  for (let i = 0; i < markers.length; i++) {
    const divIcon = leaflet.divIcon({
      html: '<div class="div-icon">' + markers[i].name + "</div>",
      iconSize: [0, 0],
    });
    iconMarkers.addLayer(
      leaflet.marker([markers[i].lat, markers[i].lng]).addTo(overlay).bindPopup(markers[i].name),
    );
    leaflet.marker([markers[i].lat, markers[i].lng], { icon: divIcon }).addTo(overlay);
  }
};

/**
 * GPX データをロードします。
 *
 * @param leaflet Leaflet 本体
 * @param overlay 配置対象の地図またはオーバーレイ
 * @param path GPX ファイルの URL
 * @param color カラーコード
 */
const setGpx = (leaflet, overlay, path, color) => {
  new leaflet.GPX(path, {
    async: true,
    polyline_options: { color: color },
    markers: { startIcon: null, endIcon: null },
  }).addTo(overlay);
};
