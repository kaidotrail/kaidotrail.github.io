/** canonical メタデータ用のホスト名 */
const CANONICAL_HOST = "kaidotrail.github.io";

/** ポップアップの画像スライダーの状態 */
let current = 0;

/**
 * 地図インスタンスを作成します。
 * @param {*} leaflet Leaflet 本体
 * @returns {*} 地図インスタンス
 */
const createMap = (leaflet) => {
  const map = leaflet.map("map", {
    zoomControl: false,
    contextmenu: true,
    contextmenuItems: [
      {
        text: '<i class="fa-solid fa-magnifying-glass-plus"></i> ズームイン',
        callback: () => map.zoomIn(),
      },
      {
        text: '<i class="fa-solid fa-magnifying-glass-minus"></i> ズームアウト',
        callback: () => map.zoomOut(),
      },
      { separator: true },
      {
        text: '<i class="fa-solid fa-copy"></i> 座標をコピー',
        callback: (e) => {
          const lat = Math.round(e.latlng.lat * 10000000) / 10000000;
          const lng = Math.round(e.latlng.lng * 10000000) / 10000000;
          navigator.clipboard.writeText(lat + "," + lng);
          alert(`コピーしました: ${lat},${lng}`);
        },
      },
      {
        text: '<i class="fa-solid fa-map"></i> Google マップで開く',
        callback: (e) => {
          const lat = Math.round(e.latlng.lat * 10000000) / 10000000;
          const lng = Math.round(e.latlng.lng * 10000000) / 10000000;
          const zoom = map.getZoom();
          window.open(
            `https://www.google.com/maps/@?api=1&map_action=map&map_action=map` +
              `&center=${lat},${lng}&zoom=${zoom}&basemap=roadmap`,
            "_blank",
          );
        },
      },
      {
        text: '<i class="fa-solid fa-file-code"></i> GPX ファイルを描画...',
        callback: () => toggleOwnGpx(),
      },
    ],
  });

  return map;
};

/**
 * タイルやコントロールなどを初期化します。
 * @param {*} leaflet Leaflet 本体
 * @param {*} map 地図インスタンス
 * @param {*} overlays オーバーレイ構成
 * @returns {*} レイヤーコントロール
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
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    {
      attribution: 'Tiles &copy; <a href="https://www.esrij.com/" target="_blank">Esri Japan</a>',
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
  initOwnGpx(leaflet, map);

  return layerControl;
};

/**
 * ドラッグやズームをした際にその後の位置座標をクエリーパラメーター lat, lng, z にそれぞれ格納します。
 * @param {*} map 地図インスタンス
 * @param {*|void} defaultFunc パラメーターがなかった場合の初期座標を設定する処理
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
 * @param {*} leaflet Leaflet 本体
 * @param {*} map 地図インスタンス
 * @param {*} layer 浅いズームレベルでは点のようにしておき、深いズームレベルでアイコンを表示するレイヤー
 * @param {Array} layerIcons 深いズームレベルで表示するアイコンの情報が格納された配列
 * @param {number} zoomThreshold アイコンを切り替えるズームレベル
 */
const initIconUpdater = (leaflet, map, layer, layerIcons, zoomThreshold = 12) => {
  if (new URLSearchParams(location.search).get("select") && zoomThreshold === 12) {
    zoomThreshold = 10;
  }
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
 * @param {*} layer 対象レイヤー
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
 * スポット一覧の絞り込み機能を有効化します。
 * @param {Array} spots スポット一覧
 * @returns {Array} 絞り込まれたスポット一覧
 */
const initSpotSelector = (spots) => {
  const q = new URLSearchParams(location.search);
  const select = q.get("select");
  const pathName = location.pathname.split("/").slice(-1)[0];
  const canonical = document.createElement("link");
  const ld = document.createElement("script");
  ld.type = "application/ld+json";
  canonical.rel = "canonical";
  if (select) {
    const iconType = iconTypes.get(select);
    if (iconType) {
      // title を更新
      document.title = iconType.description + `一覧 - ` + document.title;

      // canonical URL を更新
      canonical.href = `https://${CANONICAL_HOST}/${pathName}?select=${select}`;
      document.head.appendChild(canonical);

      // LD-JSON を更新
      ld.innerText = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "中原街道",
            item: `https://${CANONICAL_HOST}/${pathName}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: iconType.description + "一覧",
          },
        ],
      });
      document.head.appendChild(ld);

      // タイトルを更新
      const routeEntry = document.getElementById("route-entry");
      if (routeEntry) {
        routeEntry.innerHTML = `<a href="${pathName}">${routeEntry.innerText}</a>`;
      }
      const selectEntry = document.getElementById("select-entry");
      if (selectEntry) {
        selectEntry.innerHTML = `<span class="sep">&gt;</span> ${iconType.description}一覧`;
      }

      // ズームインメッセージを更新
      const zoomInMessage = document.getElementById("zoom-in-message");
      if (zoomInMessage) {
        zoomInMessage.innerHTML = `<span>ズームインすると${iconType.description}が表示されます</span>`;
      }

      return spots.filter((spot) => spot.icon === select);
    }
  }
  // canonical URL を更新
  canonical.href = `https://kaidotrail.github.io/${pathName}`;
  document.head.appendChild(canonical);

  // LD-JSON を更新
  ld.innerText = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ "@type": "ListItem", position: 1, name: "中原街道" }],
  });
  document.head.appendChild(ld);

  return spots;
};

/**
 * 指定したアイコンクラス名と色で地図用アイコンを生成します。
 * @param {*} leaflet Leaflet 本体
 * @param {string} iconName アイコン名
 * @param {string} color 色
 * @returns {string} div 要素文字列
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
  ["honjin", { icon: "fa-landmark-flag", color: "#8B0000", description: "本陣" }],
  ["ichirizuka", { icon: "fa-mound", color: "#228B22", description: "一里塚" }],
  ["kosatsuba", { icon: "fa-scroll", color: "#A0522D", description: "高札場" }],
  ["pass", { icon: "fa-mountain", color: "#006400", description: "峠" }],
  ["watashi", { icon: "fa-ship", color: "#1E90FF", description: "渡場" }],
  ["bridge", { icon: "fa-bridge", color: "#808080", description: "橋" }],
  ["guide", { icon: "fa-signs-post", color: "#FF8C00", description: "案内" }],
  ["building", { icon: "fa-landmark", color: "#8B4513", description: "建造物" }],
  ["monument", { icon: "fa-monument", color: "#696969", description: "モニュメント類" }],
  ["shrine", { icon: "fa-torii-gate", color: "#FF0000", description: "神社" }],
  ["temple", { icon: "fa-dharmachakra", color: "#000000", description: "寺" }],
  ["camera", { icon: "fa-camera", color: "#ff00ff", description: "景勝地" }],
  ["food", { icon: "fa-utensils", color: "#20b2aa", description: "飲食店" }],
  ["shop", { icon: "fa-shop", color: "#8a2be2", description: "商店" }],
  ["sakagura", { icon: "fa-wine-bottle", color: "#DAA520", description: "酒蔵" }],
  ["sekisho", { icon: "fa-archway", color: "#a52a2a", description: "関所" }],
  ["default", { icon: "fa-map-pin", color: "royalblue", description: "未分類" }],
]);

/**
 * マーカー情報をもとにポップアップの内容を構築します。
 * @param {*} markerData マーカー情報
 * @returns {string} div 要素文字列
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
        (markerData.url.endsWith(".pdf")
          ? `<i class="fa-solid fa-file-pdf" style="color:red"></i>`
          : `<i class="fa-solid fa-globe" style="color:darkblue"></i>`) +
        `<a href="${markerData.url}" target="_blank">${displayUrl}</a> `;
    }
    if (markerData.x) {
      content +=
        `<i class="fa-brands fa-x-twitter"></i>` +
        `<a href="https://x.com/${markerData.x}" target="_blank">@${markerData.x}</a> `;
    }
    if (markerData.instagram) {
      content +=
        `<i class="fa-brands fa-instagram" style="color:pink"></i>` +
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
    `form_edit.html?` +
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
 * @param {*} leaflet Leaflet 本体
 * @param {*} overlay 配置対象の地図またはオーバーレイ
 * @param {*} layer レイヤー
 * @param {*} markers マーカー一覧
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
 * @param {*} leaflet Leaflet 本体
 * @param {*} layer レイヤー
 * @param {Array} source マーカー情報
 * @param {boolean} isDot ドットにする場合は true
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
 * 地図にスポット一覧を設定します。
 * @param {*} leaflet Leaflet 本体
 * @param {*} map 地図インスタンス
 * @param {*} spotOverlay スポット一覧オーバーレイ
 * @param {Array} spots スポット一覧
 * @returns {Array} 画面に表示するスポット一覧
 */
const initSpots = (leaflet, map, spotOverlay, spots) => {
  const spotLayer = leaflet.featureGroup();
  const selectedSpots = initSpotSelector(spots);
  setMarkers(leaflet, spotOverlay, spotLayer, selectedSpots);
  initIconUpdater(leaflet, map, spotLayer, selectedSpots);
  initPopupSlider(spotLayer);
  return selectedSpots;
};

/**
 * GPX データをロードします。
 * @param {*} leaflet Leaflet 本体
 * @param {*} overlay 配置対象の地図またはオーバーレイ
 * @param {string} path GPX ファイルの URL
 * @param {string} color カラーコード
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
 * @param {string} target id
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
 * @param {*} leaflet Leaflet 本体
 * @param {*} map 地図インスタンス
 */
const initOwnGpx = (leaflet, map) => {
  const ownGpx = document.getElementById("own-gpx");
  const backToMap = document.createElement("button");
  backToMap.innerHTML = "<i class='fa-solid fa-circle-arrow-left'></i> 地図に戻る";
  backToMap.style.marginTop = "10px";
  backToMap.addEventListener("click", toggleOwnGpx);
  ownGpx.appendChild(backToMap);
  const h2 = document.createElement("h2");
  h2.innerText = "GPX ファイル描画 (実験的機能)";
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
 * @param {*} leaflet Leaflet 本体
 * @param {*} layerControl initMap() が返却した LayerControl
 * @param {string} dataSet データセットフォルダ名
 * @param {string} age 時期フォルダ名
 */
const activateKonjakuMap = (leaflet, layerControl, dataSet, age) => {
  layerControl.addBaseLayer(
    leaflet.tileLayer(`https://ktgis.net/kjmapw/kjtilemap/${dataSet}/${age}/{z}/{x}/{-y}.png`, {
      attribution: '<a href="https://ktgis.net/kjmapw/data.html" target="_blank">今昔マップ</a>',
    }),
    `今昔マップ <span style="font-size: 0.7em">${dataSet}/${age}</span>`,
  );
};

/**
 * 迅速測図を追加します。
 * @param {*} leaflet Leaflet 本体
 * @param {*} layerControl initMap() が返却した LayerControl
 */
const activateJinsokuMap = (leaflet, layerControl) => {
  layerControl.addBaseLayer(
    leaflet.tileLayer(`https://habs.rad.naro.go.jp/rapid16/{z}/{x}/{-y}.png`, {
      attribution:
        '<a href="https://habs.rad.naro.go.jp/habs_map.html" target="_blank">農研機構農業環境研究部門</a>',
    }),
    `迅速測図 <span style="font-size: 0.7em">関東地方のみ</span>`,
  );
};
