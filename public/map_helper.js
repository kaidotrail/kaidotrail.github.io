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
  tileLayers[1] = leaflet.tileLayer("https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png", {
    attribution:
      "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>地理院タイル</a>",
  });
  tileLayers[2] = leaflet.tileLayer(
    "https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg",
    {
      attribution:
        "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>地理院タイル</a>",
    },
  );
  tileLayers[3] = leaflet.tileLayer("https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}", {
    attribution:
      "<a href='https://developers.google.com/maps/documentation' target='_blank'>Google Maps</a>",
  });
  tileLayers[4] = leaflet.tileLayer(
    "http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    {
      attribution: 'Tiles &copy; <a href="http://www.esrij.com/"> Esri Japan </a>',
    },
  );
  tileLayers[3].addTo(map); // Google マップをデフォルトにする
  leaflet.control
    .layers(
      {
        "国土地理院 標準地図": tileLayers[0],
        "国土地理院 淡色地図": tileLayers[1],
        "国土地理院 写真": tileLayers[2],
        "Google マップ": tileLayers[3],
        "Esri 地形図": tileLayers[4],
      },
      overlays,
    )
    .addTo(map);
  leaflet.control.locate().addTo(map);
};

/**
 * ドラッグやズームをした際にその後の位置座標をクエリーパラメーター lat, lng, z にそれぞれ格納します。
 *
 * @param map 地図インスタンス
 * @param defaultFunc パラメーターがなかった場合の初期座標を設定する処理
 */
const initQueryParamUpdater = (map, defaultFunc) => {
  const q = new URLSearchParams(location.search);
  if (q.get("lat") && q.get("lng")) {
    map.setView([q.get("lat"), q.get("lng")], q.get("z") ?? 13);
  } else if (defaultFunc) {
    defaultFunc();
  }
  map.on("moveend", () => {
    const url = new URL(window.location);
    url.searchParams.set("lat", map.getCenter().lat);
    url.searchParams.set("lng", map.getCenter().lng);
    history.replaceState(null, document.title, url);
  });
  map.on("zoomend", () => {
    const url = new URL(window.location);
    url.searchParams.set("z", map.getZoom());
    history.replaceState(null, document.title, url);
  });
};

/**
 * ズームレベルに応じてアイコンを切り替える機能を設定します。
 *
 * @param leaflet Leaflet 本体
 * @param map 地図インスタンス
 * @param mainLayer 深いズームレベルではアイコンを非表示にするレイヤー
 * @param subLayer 浅いズームレベルでは点のようにしておき、深いズームレベルでアイコンを表示するレイヤー
 * @param subLayerIcons 深いズームレベルで表示するアイコンの情報が格納された配列
 * @param zoomThreshold アイコンを切り替えるズームレベル
 */
const initIconUpdater = (leaflet, map, mainLayer, subLayer, subLayerIcons, zoomThreshold = 14) => {
  const toggle = () => {
    if (map.getZoom() >= zoomThreshold) {
      map.removeLayer(mainLayer);
      updateMarkerIcon(leaflet, subLayer, subLayerIcons, false);
    } else {
      map.addLayer(mainLayer);
      updateMarkerIcon(leaflet, subLayer, subLayerIcons, true);
    }
  };
  toggle();
  map.on("zoomend", () => toggle());
};

/**
 * 指定したアイコンクラス名と色で地図用アイコンを生成します。
 *
 * @param leaflet Leaflet 本体
 * @param iconName アイコン名
 * @param color 色
 * @return {*}
 */
const createIcon = (leaflet, iconName, color) => {
  return leaflet.divIcon({
    html: `<div class="map-icon" style="color: ${color}"><i class="fa-solid ${iconName}"></i></div>`,
    className: "custom-leaflet-icon",
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

const iconTypes = new Map([
  ["honjin", { icon: "fa-h-square", color: "#8B0000" }],
  ["ichirizuka", { icon: "fa-tree", color: "#228B22" }],
  ["pass", { icon: "fa-mountain", color: "#800080" }],
  ["watashi", { icon: "fa-ship", color: "#1E90FF" }],
  ["guide", { icon: "fa-triangle-exclamation", color: "#FF8C00" }],
  ["building", { icon: "fa-landmark", color: "#8B4513" }],
  ["monument", { icon: "fa-monument", color: "#696969" }],
  ["shrine", { icon: "fa-torii-gate", color: "#FF0000" }],
  ["temple", { icon: "fa-dharmachakra", color: "#000000" }],
  ["stone", { icon: "fa-map-signs", color: "#708090" }],
  ["camera", { icon: "fa-camera", color: "#DAA520" }],
  ["default", { icon: "fa-map-pin", color: "royalblue" }],
]);

/**
 * マーカー一覧をマップに配置します。
 *
 * @param leaflet Leaflet 本体
 * @param overlay 配置対象の地図またはオーバーレイ
 * @param layer レイヤー
 * @param markers マーカー一覧
 */
const setMarkers = (leaflet, overlay, layer, markers) => {
  for (let i = 0; i < markers.length; i++) {
    if (!markers[i].icon) {
      const divIcon = leaflet.divIcon({
        html: '<div class="div-icon">' + markers[i].name + "</div>",
        iconSize: [0, 0],
      });
      leaflet.marker(markers[i].coordinate, { icon: divIcon }).addTo(overlay);
    }
    const iconType = iconTypes.get(markers[i].icon ?? "default");
    layer.addLayer(
      leaflet
        .marker(markers[i].coordinate, { icon: createIcon(leaflet, iconType.icon, iconType.color) })
        .addTo(overlay)
        .bindPopup(markers[i].name),
    );
  }
};

/**
 * アイコンを変更します。
 *
 * @param leaflet Leaflet 本体
 * @param layer レイヤー
 * @param source マーカー情報
 * @param isDot ドットにする場合は true
 */
const updateMarkerIcon = (leaflet, layer, source, isDot) => {
  const markers = layer.getLayers();
  for (let i = 0; i < markers.length; i++) {
    if (!(markers[i] instanceof leaflet.Marker)) {
      continue;
    }
    const iconType = iconTypes.get(source[i].icon ?? "default");
    if (isDot) {
      markers[i].setIcon(
        leaflet.divIcon({
          html: `<div class="map-icon-dot" style="color: ${iconType.color}"><i class="fa-solid fa-circle-dot"></i></div>`,
          className: "custom-leaflet-icon",
          iconSize: [5, 5],
        }),
      );
    } else {
      markers[i].setIcon(createIcon(leaflet, iconType.icon, iconType.color));
    }
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
    polyline_options: { color: color, weight: 2 },
    markers: { startIcon: null, endIcon: null },
  })
    .on("error", (e) => console.error("GPX の読み込みに失敗しました: " + String(e)))
    .addTo(overlay);
};
