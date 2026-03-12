/**
 * スポット一覧を表示します。すでに表示している場合は地図表示に戻ります。
 */
const toggleSpotList = () => {
  const mapElm = document.getElementById("map");
  const spotList = document.getElementById("spot-list");
  if (spotList.style.display === "block") {
    spotList.style.display = "none";
    if (mapElm.style.display === "none") {
      mapElm.style.display = "block";
    }
  } else {
    const nonMapScreens = document.getElementsByClassName("non-map-screen");
    for (const nonMapScreen of nonMapScreens) {
      nonMapScreen.style.display = nonMapScreen.id === "spot-list" ? "block" : "none";
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
 * 表を生成します。
 *
 * @param spots スポット一覧
 * @param name 名前
 * @param parent 追加対象の要素
 * @param iconTypes アイコン定義のマップ
 */
const buildTable = (spots, name, parent, iconTypes) => {
  const title = document.createElement("h2");
  title.innerText = name;
  parent.appendChild(title);
  const table = document.createElement("table");
  spots.forEach((spot) => {
    const tr = document.createElement("tr");
    const td1 = document.createElement("td");
    td1.style.width = "200px";
    const iconType = iconTypes.get(spot.icon);
    td1.innerHTML = `<i class="fa-solid ${iconType.icon}" style="color: ${iconType.color}"></i> `;
    td1.innerHTML += `<a href="?lat=${spot.coordinate[0]}&lng=${spot.coordinate[1]}&z=17">${spot.name}</a><br/>`;
    if (spot.kana) {
      td1.innerHTML += `${spot.kana}<br/>`;
    }
    if (spot.pictures) {
      const pic = spot.pictures[0];
      td1.innerHTML += `<img src="${pic.url}" alt="${pic.comment}" width="200px"/><br/>`;
      if (spot.pictures.length > 1) {
        td1.innerHTML += `<div class="other-pics">(他${spot.pictures.length - 1}枚)</div>`;
      }
    }
    tr.appendChild(td1);
    const td2 = document.createElement("td");
    td2.innerHTML = spot.description ?? "(未記入)";
    tr.appendChild(td2);
    table.appendChild(tr);
  });
  parent.appendChild(table);
};

/**
 * マップに戻るボタンを生成します。
 *
 * @return {HTMLButtonElement} マップに戻るボタン
 */
const createBackToMapButton = () => {
  const backToMap = document.createElement("button");
  backToMap.innerHTML = "<i class='fa-solid fa-circle-arrow-left'></i> 地図に戻る";
  backToMap.addEventListener("click", toggleSpotList);
  return backToMap;
};

/**
 * スポット一覧ページを初期化します。
 *
 * @param spots スポット一覧
 * @param iconTypes アイコン定義
 */
const initSpotList = (spots, iconTypes) => {
  const buttonOpenSpotList = document.getElementById("spot-list-open");
  const spotList = document.getElementById("spot-list");
  buttonOpenSpotList.addEventListener("click", toggleSpotList);
  const btm1 = createBackToMapButton();
  btm1.style.marginTop = "10px";
  spotList.appendChild(btm1);
  const passList = spots.filter((spot) => spot.icon === "pass");
  if (passList.length > 0) {
    buildTable(passList, "峠", spotList, iconTypes);
  }
  const honjinList = spots.filter((spot) => spot.icon === "honjin");
  if (honjinList.length > 0) {
    buildTable(honjinList, "本陣", spotList, iconTypes);
  }
  const ichirizukaList = spots.filter((spot) => spot.icon === "ichirizuka");
  if (ichirizukaList.length > 0) {
    buildTable(ichirizukaList, "一里塚", spotList, iconTypes);
  }
  const otherList = spots.filter(
    (spot) => spot.icon !== "pass" && spot.icon !== "honjin" && spot.icon !== "ichirizuka",
  );
  if (otherList.length > 0) {
    buildTable(otherList, "その他", spotList, iconTypes);
  }
  const picCount = spots
    .map((spot) => (spot.pictures ? spot.pictures.length : 0))
    .reduce((acc, v) => acc + v, 0);
  const counter = document.createElement("p");
  counter.innerHTML = `全 ${spots.length} 地点 (写真 ${picCount} 枚)`;
  spotList.appendChild(counter);
  const btm2 = createBackToMapButton();
  btm2.style.marginBottom = "10px";
  spotList.appendChild(btm2);
  const q = new URLSearchParams(location.search);
  if (q.get("landing") === "spots") {
    toggleSpotList();
  }
};
