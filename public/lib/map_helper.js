/** ポップアップの画像スライダーの状態 */
let current = 0;

/**
 * タイルやコントロールなどを初期化します。
 *
 * @param leaflet Leaflet 本体
 * @param map 地図インスタンス
 * @param overlays オーバーレイ構成
 * @return {*} レイヤーコントロール
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
      attribution: 'Tiles &copy; <a href="http://www.esrij.com/" target="_blank">Esri Japan</a>',
    },
  );
  tileLayers[3].addTo(map); // Google マップをデフォルトにする
  const layerControl = leaflet.control
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
  leaflet.control.zoom({ position: "bottomright" }).addTo(map);
  leaflet.control.locate({ position: "bottomright" }).addTo(map);

  // Legend
  if (overlays) {
    const hasAltRoute = Object.keys(overlays).filter((k) => k.endsWith("ルート")).length > 1;
    const legend = leaflet.control({ position: "bottomleft" });
    legend.onAdd = () => {
      const div = leaflet.DomUtil.create("div", "map-legend");
      div.innerHTML =
        `凡例<br/>` +
        `<span style="color: red"><i class="fa-solid fa-minus"></i> おすすめルート</span><br/>` +
        (hasAltRoute
          ? `<span style="color: lightcoral"><i class="fa-solid fa-minus"></i> 代替ルート</span><br/>`
          : ``) +
        `<span style="color: blue"><i class="fa-solid fa-minus"></i> 足跡 (GPS ログ)</span><br/>`;
      return div;
    };
    legend.addTo(map);
  }

  return layerControl;
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
 * @param layer 浅いズームレベルでは点のようにしておき、深いズームレベルでアイコンを表示するレイヤー
 * @param layerIcons 深いズームレベルで表示するアイコンの情報が格納された配列
 * @param zoomThreshold アイコンを切り替えるズームレベル
 */
const initIconUpdater = (leaflet, map, layer, layerIcons, zoomThreshold = 12) => {
  const toggle = () => {
    updateMarkerIcon(leaflet, layer, layerIcons, map.getZoom() < zoomThreshold);
    const zoomInMessage = document.getElementById("zoom-in-message");
    if (zoomInMessage) {
      zoomInMessage.style.display = map.getZoom() < zoomThreshold ? "block" : "none";
    }
  };
  toggle();
  map.on("zoomend", () => toggle());
};

/**
 * ポップアップ内の画像スライダー機能を初期化します。
 *
 * @param layer 対象レイヤー
 */
const initPopupSlider = (layer) => {
  const arrowRightClickHandler = () => {
    const nextElements = document.getElementsByClassName(`popup-pic-${current + 1}`);
    if (nextElements.length > 0) {
      const elements = document.getElementsByClassName(`popup-pic-${current}`);
      if (elements.length > 0) {
        elements[0].style.display = "none";
        nextElements[0].style.display = "block";
        current++;
      }
    }
  };
  const arrowLeftClickHandler = () => {
    const prevElements = document.getElementsByClassName(`popup-pic-${current - 1}`);
    if (prevElements.length > 0) {
      const elements = document.getElementsByClassName(`popup-pic-${current}`);
      if (elements.length > 0) {
        elements[0].style.display = "none";
        prevElements[0].style.display = "block";
        current--;
      }
    }
  };
  layer.on("popupopen", () => {
    const arrowRightElements = document.getElementsByClassName("arrow-right");
    for (let i = 0; i < arrowRightElements.length; i++) {
      arrowRightElements[i].addEventListener("click", arrowRightClickHandler);
    }
    const arrowLeftElements = document.getElementsByClassName("arrow-left");
    for (let i = 0; i < arrowLeftElements.length; i++) {
      arrowLeftElements[i].addEventListener("click", arrowLeftClickHandler);
    }
    const layerControl = document.getElementsByClassName("leaflet-top");
    for (const lc of layerControl) {
      lc.style.display = "none";
    }
    const zoomInMessage = document.getElementById("zoom-in-message");
    if (zoomInMessage) {
      zoomInMessage.style.display = "none";
    }
  });
  layer.on("popupclose", () => {
    current = 0;
    const arrowRightElements = document.getElementsByClassName("arrow-right");
    for (let i = 0; i < arrowRightElements.length; i++) {
      arrowRightElements[i].removeEventListener("click", arrowRightClickHandler);
    }
    const arrowLeftElements = document.getElementsByClassName("arrow-left");
    for (let i = 0; i < arrowLeftElements.length; i++) {
      arrowLeftElements[i].removeEventListener("click", arrowLeftClickHandler);
    }
    const layerControl = document.getElementsByClassName("leaflet-top");
    for (const lc of layerControl) {
      lc.style.display = "block";
    }
  });
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
    iconAnchor: [15, 15],
    popupAnchor: [1, -18],
  });
};

/** アイコン種別の定義 */
const iconTypes = new Map([
  ["honjin", { icon: "fa-landmark-flag", color: "#8B0000" }],
  ["ichirizuka", { icon: "fa-mound", color: "#228B22" }],
  ["kosatsuba", { icon: "fa-scroll", color: "#A0522D" }],
  ["pass", { icon: "fa-mountain", color: "#006400" }],
  ["watashi", { icon: "fa-ship", color: "#1E90FF" }],
  ["bridge", { icon: "fa-bridge", color: "#808080" }],
  ["guide", { icon: "fa-signs-post", color: "#FF8C00" }],
  ["building", { icon: "fa-landmark", color: "#8B4513" }],
  ["monument", { icon: "fa-monument", color: "#696969" }],
  ["shrine", { icon: "fa-torii-gate", color: "#FF0000" }],
  ["temple", { icon: "fa-dharmachakra", color: "#000000" }],
  ["camera", { icon: "fa-camera", color: "#ff00ff" }],
  ["food", { icon: "fa-utensils", color: "#20b2aa" }],
  ["shop", { icon: "fa-shop", color: "#8a2be2" }],
  ["sakagura", { icon: "fa-wine-bottle", color: "#DAA520" }],
  ["sekisho", { icon: "fa-archway", color: "#a52a2a" }],
  ["default", { icon: "fa-map-pin", color: "royalblue" }],
]);

/**
 * マーカー情報をもとにポップアップの内容を構築します。
 *
 * @param markerData マーカー情報
 * @return {string} HTML 文字列
 */
const buildPopupContent = (markerData) => {
  let content = `<div class="popup-content">`;
  content += `<h1>${markerData.name}</h1>`;
  if (markerData.kana) {
    content += `<h2>${markerData.kana}</h2>`;
  }
  if (markerData.description) {
    content += `<p>${markerData.description}</p>`;
  }
  if (markerData.url || markerData.x || markerData.instagram) {
    content += `<p class="link-area">`;
    if (markerData.url) {
      const displayUrl = markerData.url.replace("https://", "").replace("http://", "");
      content +=
        `<i class="fa-solid fa-globe"></i>` +
        `<a href="${markerData.url}" target="_blank">${displayUrl}</a> `;
    }
    if (markerData.x) {
      content +=
        `<i class="fa-brands fa-x-twitter"></i>` +
        `<a href="https://x.com/${markerData.x}" target="_blank">@${markerData.x}</a> `;
    }
    if (markerData.instagram) {
      content +=
        `<i class="fa-brands fa-instagram"></i>` +
        `<a href="https://www.instagram.com/${markerData.instagram}/" target="_blank">${markerData.instagram}</a> `;
    }
    content += "</p>";
  }
  if (markerData.pictures && markerData.pictures.length > 0) {
    for (let i = 0; i < markerData.pictures.length; i++) {
      content += `<div class="popup-pic-${i}" style="display:${i === 0 ? "block" : "none"}">`;
      content += `<img src="${markerData.pictures[i].url}" width="300" height="225" alt="${markerData.pictures[i].comment}"/>`;
      content += `<div class="popup-text">`;
      if (markerData.pictures.length > 1) {
        content += `[${i + 1}/${markerData.pictures.length}] `;
      }
      content += `${markerData.pictures[i].comment ?? ""}<br/>`;
      try {
        const tokens = URL.parse(markerData.pictures[i].url).pathname.split("/");
        const date = new Date(tokens[3] + "-" + tokens[4]).toLocaleDateString();
        content += `<span class="credit">${date} ${tokens[2]}</span>`;
      } catch (e) {
        console.error("写真の URL から日付と作者を解析できません: ", String(e));
      }
      content += `</div>`;
      content += `</div>`;
    }
    if (markerData.pictures.length > 1) {
      content += `<div class="popup-arrows">`;
      content += `<i class="arrow-left fa-solid fa-circle-chevron-left"></i>`;
      content += `<i class="arrow-right fa-solid fa-circle-chevron-right"></i>`;
      content += `</div>`;
    }
  } else {
    content += `<br/>`;
  }
  const formUrl =
    `form.html?` +
    `kaido=${location.pathname.split("/").slice(-1)[0].replace(".html", "")}` +
    `&coordinate=${markerData.coordinate[0]},${markerData.coordinate[1]}` +
    `&spot=${markerData.name}`;
  content +=
    `<div class="edit-request-link">` +
    `<a href="${formUrl}" target="_blank"><i class="fa-solid fa-pen-to-square"></i> 修正</a>` +
    `</div>`;
  content += `</div>`;
  return content;
};

/**
 * マーカー一覧をマップに配置します。
 *
 * @param leaflet Leaflet 本体
 * @param overlay 配置対象の地図またはオーバーレイ
 * @param layer レイヤー
 * @param markers マーカー一覧
 */
const setMarkers = (leaflet, overlay, layer, markers) => {
  for (const marker of markers) {
    if (!marker.icon) {
      const divIcon = leaflet.divIcon({
        html: '<div class="div-icon">' + marker.name + "</div>",
        iconSize: [0, 0],
        iconAnchor: [0, -14],
      });
      layer.addLayer(leaflet.marker(marker.coordinate, { icon: divIcon }).addTo(overlay));
      continue;
    }
    const iconType = iconTypes.get(marker.icon) ?? iconTypes.get("default");
    layer.addLayer(
      leaflet
        .marker(marker.coordinate, { icon: createIcon(leaflet, iconType.icon, iconType.color) })
        .addTo(overlay)
        .bindPopup(buildPopupContent(marker)),
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
    const iconType = iconTypes.get(source[i].icon) ?? iconTypes.get("default");
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

/**
 * GPX 地図以外の画面に切り替えます。すでに表示している場合は地図表示に戻ります。
 *
 * @param target id
 */
const toggleNonMapScreen = (target) => {
  const mapElm = document.getElementById("map");
  const spotList = document.getElementById(target);
  if (spotList.style.display === "block") {
    spotList.style.display = "none";
    if (mapElm.style.display === "none") {
      mapElm.style.display = "block";
    }
  } else {
    const nonMapScreens = document.getElementsByClassName("non-map-screen");
    for (const nonMapScreen of nonMapScreens) {
      nonMapScreen.style.display = nonMapScreen.id === target ? "block" : "none";
    }
    mapElm.style.display = "none";
  }
  if (spotList.style.display === "block") {
    const zoomInMessage = document.getElementById("zoom-in-message");
    if (zoomInMessage) {
      zoomInMessage.style.display = "none";
    }
  }
};

/**
 * GPX 表示機能を表示します。すでに表示している場合は地図表示に戻ります。
 */
const toggleOwnGpx = () => {
  toggleNonMapScreen("own-gpx");
};

/**
 * 指定した GPX ファイルを重ねて表示する機能を初期化します。
 *
 * @param leaflet Leaflet 本体
 * @param map 地図インスタンス
 */
const initOwnGpx = (leaflet, map) => {
  const ownGpx = document.getElementById("own-gpx");
  const backToMap = document.createElement("button");
  backToMap.innerHTML = "<i class='fa-solid fa-circle-arrow-left'></i> 地図に戻る";
  backToMap.style.marginTop = "10px";
  backToMap.addEventListener("click", toggleOwnGpx);
  ownGpx.appendChild(backToMap);
  const h2 = document.createElement("h2");
  h2.innerText = "GPX ファイル表示機能 (実験中)";
  ownGpx.appendChild(h2);
  const p1 = document.createElement("p");
  p1.innerText =
    "GPX ファイルを指定すると、地図に重ねて表示することができます。GPX ファイルの軌跡は緑色の線で表示されます。" +
    "ファイルは同時に複数指定することができます。";
  ownGpx.appendChild(p1);
  const p2 = document.createElement("p");
  p2.innerText =
    "備考: ファイルの処理はブラウザ内で完結するため、サーバーにはアップロードしません。ブラウザでページを再読み込みすると表示はリセットされます。";
  ownGpx.appendChild(p2);
  const input = document.createElement("input");
  input.name = "file";
  input.type = "file";
  input.multiple = true;
  input.addEventListener(
    "change",
    () => {
      const bounds = leaflet.latLngBounds();
      for (const file of input.files) {
        const url = window.URL.createObjectURL(file);
        new leaflet.GPX(url, {
          async: true,
          polyline_options: { color: "lime", weight: 2 },
          markers: { startIcon: null, endIcon: null },
        })
          .on("error", (e) => console.error("GPX の読み込みに失敗しました: " + String(e)))
          .on("loaded", async (e) => {
            window.URL.revokeObjectURL(url);
            await navigator.locks.request("gpx-files", async () => {
              bounds.extend(e.target.getBounds());
              map.fitBounds(bounds);
            });
            toggleOwnGpx();
          })
          .addTo(map);
      }
    },
    false,
  );
  ownGpx.appendChild(input);
  const q = new URLSearchParams(location.search);
  if (q.get("landing") === "gpx") {
    toggleOwnGpx();
  }
};

/**
 * 今昔マップを追加します。
 *
 * @param leaflet Leaflet 本体
 * @param layerControl initMap() が返却した LayerControl
 * @param dataSet データセットフォルダ銘
 * @param age 時期フォルダ銘
 */
const activateKonjakuMap = (leaflet, layerControl, dataSet, age) => {
  layerControl.addBaseLayer(
    leaflet.tileLayer(`https://ktgis.net/kjmapw/kjtilemap/${dataSet}/${age}/{z}/{x}/{-y}.png`, {
      attribution: '<a href="https://ktgis.net/kjmapw/data.html" target="_blank">今昔マップ</a>',
    }),
    `今昔マップ <span style="font-size: 0.7em">${dataSet}/${age}</span>`,
  );
};
