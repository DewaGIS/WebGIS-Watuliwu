console.log("WebGIS loaded!");

/* ============================================
   1. MAP ENGINE
   ============================================ */

const map = L.map("map", {
  center: [-3.98, 121.10],
  zoom: 14,
  zoomControl: false,
  minZoom: 5,
  maxZoom: 19,
});

/* ============================================
   2. BASEMAP
   ============================================ */
const osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 20,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

const gogleSat = L.tileLayer("https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
  attribution: "Google Satellite",
  maxZoom: 20,
}).addTo(map);

const gogleMap = L.tileLayer("https://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
  attribution: "Google Map",
  maxZoom: 20,
}).addTo(map);

/* ============================================
   3. MAP CONTROLS
   ============================================ */
L.control
  .zoom({
    position: "topright",
  })
  .addTo(map);

L.control
  .scale({
    metric: true,
    imperial: false,
    position: "bottomleft",
  })
  .addTo(map);

  /* ============================================
   4. EVENT LISTENER (KLIK)
   Klik pada fitur tidak memicu alert (bubblingMouseEvents: false),
   alert hanya muncul saat klik di area kosong peta.
   ============================================ */
map.on("click", function (e) {
  const lat = e.latlng.lat;
  const lng = e.latlng.lng;

  alert("Koordinat: " + lat + ", " + lng);
});

///* 5. GeoTiff LAYER//
const geotiffLayer = L.tileLayer(
    "https://api.maptiler.com/tiles/01a109cf-b57e-7dae-9019-f4a64d52bfbc/{z}/{x}/{y}.webp?key=lyewLP08bxspsIE3gBhr")
    .addTo(map);
    
    const kelasLandcover = {
  1: { nama: "Air", warna: "#419bdf" },
  2: { nama: "Pohon", warna: "#397d49" },
  4: { nama: "Vegetasi tergenang", warna: "#7a87c6" },
  5: { nama: "Tanaman pertanian", warna: "#e49635" },
  7: { nama: "Area terbangun", warna: "#c4281b" },
  8: { nama: "Lahan terbuka", warna: "#a59b8f" },
  10: { nama: "Awan", warna: "#616161" },
  11: { nama: "Rangeland", warna: "#e3e2c3" },
};

function warnaLandcover(values) {
  const kelas = kelasLandcover[values[0]];
  return kelas ? kelas.warna : null; // null = tidak digambar
}

let layerLandcover = null;

fetch("data/landcover.tif")
  .then((res) => res.arrayBuffer())
  .then((arrayBuffer) => parseGeoraster(arrayBuffer))
  .then((georaster) => {
    console.log("Landcover georaster:", georaster);

    layerLandcover = new GeoRasterLayer({
      georaster: georaster,
      opacity: 0.6,
      resolution: 256,
      pixelValuesToColorFn: warnaLandcover,
    });

    layerLandcover.addTo(map);
    layerLandcover.bringToBack(); // di bawah layer vektor
    layersControl.addOverlay(layerLandcover, "Landcover (raster 10 m)");
  })
  .catch((err) => console.error("Gagal load landcover.tif:", err));

   /* ============================================
   6. STYLE DAN KLASIFIKASI
   ============================================ */

/* ============================================
   6.1 ASET DESA
   ============================================ */

const kategoriAsetDesa = {
  // IBADAH
  "Masjid Mujahidin": "Ibadah",
  "Masjid Miftahulkhaer": "Ibadah",
  "Masjid Nurul Jihad": "Ibadah",
  // PENDIDIKAN
  "SD Negeri 4 Lasusua": "Pendidikan",
  "SMA Negeri 1 Lasusua": "Pendidikan",
  "PAUD Bunga Karang": "Pendidikan",
  "TK Aisyiyah Ummu Kalsum": "Pendidikan",
  "SMP Al-Qur'an": "Pendidikan",
  // PERDAGANGAN & JASA
  "Pertamina": "Perdagangan & Jasa",
  "Indomaret": "Perdagangan & Jasa",
  // PEMERINTAHAN
  "Kantor Desa Watuliwu": "Pemerintahan"
};

/* ============================================
   WARNA KATEGORI
   ============================================ */

const warnaKategori = {
  "Ibadah": "#28c733",
  "Pendidikan": "#3b82f6",
  "Perdagangan & Jasa": "#f59e0b",
  "Pemerintahan": "#b21515"
};

/* ============================================
   MENGAMBIL KATEGORI ASET
   ============================================ */

function getKategori(Name) {
  return kategoriAsetDesa[Name] || "Lainnya";
}

/* ============================================
   STYLE ASET DESA
   ============================================ */

function styleAsetDesa(feature) {
  const kategori = getKategori(
    feature.properties.Name
  );

  return {
    fillColor: warnaKategori[kategori] || "#9ca3af",
    fillOpacity: 0.85,
    color: "#822626",
    weight: 0.8
  };
}

/* ============================================
   6.2 TOPOGRAFI / KETINGGIAN
   ============================================ */

const kategoriTopografi = {
  "0 - 50 Meter": "Dataran Rendah",
  "50 - 100 Meter": "Dataran Rendah Pedalaman",
  "100 - 200 Meter": "Perbukitan Rendah",
  "200 - 500 Meter": "Perbukitan",
  "500 - 1000 Meter": "Perbukitan Tinggi",
  ">1000 Meter": "Pegunungan"
};

const warnaTopografi = {
  "0 - 50 Meter": "#006400",
  "50 - 100 Meter": "#32CD32",
  "100 - 200 Meter": "#FFD700",
  "200 - 500 Meter": "#FFA500",
  "500 - 1000 Meter": "#FF0000",
  ">1000 Meter": "#800080"
};

function styleTopografi(feature) {
  const ketinggian =
    feature.properties?.Ketinggian;
  return {
    color: "#374151",
    weight: 0.8,
    fillColor:
      warnaTopografi[ketinggian] || "#d1d5db",
    fillOpacity: 0.7
  };
}

/* ============================================
   6.3 DESA WATULIWU / BATAS DESA
   ============================================ */

function styleDesaWatuliwu(feature) {
  return {
    fillColor: "#d6b98c",
    fillOpacity: 0.7,
    color: "#8b6b3d",
    weight: 1.5,
    dashArray: "5, 4"
  };
}

/* ============================================
   6.4 JALAN
   ============================================ */

function styleJalan(feature) {
  return {
    color: "#dc2626",
    weight: 4,
    opacity: 0.9
  };

}


/* ============================================
   7. LAYER GROUP
   ============================================ */

const layerAsetDesa = L.layerGroup();
const layerTopografi = L.layerGroup();
const layerDesaWatuliwu = L.layerGroup();
const layerJalan = L.layerGroup();

/* ============================================
   7.1 ASET DESA
   File: Data/Aset Desa.geojson
   ============================================ */

/* ============================================
   MENENTUKAN KATEGORI BERDASARKAN NAMA ASET
   ============================================ */

function getKategori(Name) {
  return kategoriAsetDesa[Name] || "Lainnya";
}

/* ============================================
   MEMBUAT ICON MARKER ASET DESA
   ============================================ */

function buatIconAset(kategori) {
  const warna =
    warnaKategori[kategori] || "#9ca3af";
  return L.divIcon({
    className: "marker-aset-desa",
    html: `
      <div
        style="
          width: 18px;
          height: 18px;
          background: ${warna};
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 1px 4px rgba(0,0,0,0.5);
        ">
      </div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -9]
  });
}

/* ============================================
   LOAD GEOJSON ASET DESA
   ============================================ */

fetch("Data/Aset Desa.geojson")
  .then((res) => {
    if (!res.ok) {
      throw new Error(
        "Data/Aset Desa.geojson tidak ditemukan"
      );
    }
    return res.json();
  })
  .then((data) => {

    /* ========================================
       MEMBUAT LAYER GEOJSON
       ======================================== */

    const geojsonAsetDesa = L.geoJSON(data, {

      /* ======================================
         MARKER BERDASARKAN KATEGORI
         ====================================== */

      pointToLayer: (feature, latlng) => {

        /* Ambil nama aset dari GeoJSON */

        const nama =
          feature.properties?.Name || "Lainnya";

        /* Tentukan kategori */

        const kategori =
          getKategori(nama);

        /* Buat marker sesuai warna kategori */

        return L.marker(
          latlng,
          {
            icon: buatIconAset(kategori)
          }
        );
      },

      /* ======================================
         INFORMASI SETIAP ASET
         ====================================== */

      onEachFeature: (feature, layer) => {

        /* Ambil properties */

        const p =
          feature.properties || {};

        /* Nama aset */

        const nama =
          p.Name || "Aset Desa";

        /* Kategori aset */
        const kategori =
          getKategori(nama);

          /* Nama yang digunakan Search Bar */
           p.search_name = nama;

        /* ====================================
           POPUP
           ==================================== */

        layer.bindPopup(
          `<b>${nama}</b><br>` +
          `Kategori: ${kategori}<br><br>` +
          `${p.description || ""}`
        );

        /* ====================================
           TOOLTIP
           ==================================== */

        if (p.Name) {
          layer.bindTooltip(
            p.Name,
            {
              sticky: true
            }
          );
        }
      }
    });

    /* ========================================
       MASUKKAN KE LAYER GROUP ASET DESA
       ======================================== */

    geojsonAsetDesa.addTo(
      layerAsetDesa
    );
    geojsonAsetDesa.addTo(layerCari);

    /* ========================================
       INFORMASI DI CONSOLE
       ======================================== */

    console.log(
      "Data Aset Desa berhasil dibaca:",
      data
    );
    console.log(
      "Jumlah Aset Desa:",
      data.features?.length
    );
  })
  .catch((err) => {
    console.error(
      "Gagal load Aset Desa:",
      err
    );
  });

/* ============================================
   7.2 TOPOGRAFI / KETINGGIAN
   File: Data_Topografi.geojson
   ============================================ */

fetch("Data/Topografi.geojson")
  .then((res) => {
    if (!res.ok) {
      throw new Error(
        "Data/Topografi.geojson tidak ditemukan"
      );
    }
    return res.json();
  })
  .then((data) => {
    const geojsonTopografi = L.geoJSON(data, {

      /* STYLE BERDASARKAN FIELD Ketinggian */
      style: styleTopografi,

      /* POPUP & TOOLTIP */
      onEachFeature: (feature, layer) => {
        const p =
          feature.properties || {};
        const ketinggian =
          p.Ketinggian || "-";
        const keterangan =
          p.Keterangan || "-";
        const area =
          p.area ?? "-";

          /* Nama yang digunakan Search Bar */
           p.search_name = ketinggian;

        /* POPUP */
        layer.bindPopup(
          `<b>TOPOGRAFI / KETINGGIAN</b><br><br>` +
          `Ketinggian: ${ketinggian}<br>` +
          `Keterangan: ${keterangan}<br>` +
          `Luas: ${area} ha`
        );

        /* TOOLTIP */
        if (p.Ketinggian) {
          layer.bindTooltip(
            p.Ketinggian,
            {
              sticky: true
            }
          );
        }
      }
    });

    /* MASUKKAN KE LAYER GROUP TOPOGRAFI */
    geojsonTopografi.addTo(
      layerTopografi
    );
    geojsonTopografi.addTo(layerCari);
  })
  .catch((err) => {
    console.error(
      "Gagal load Topografi:",
      err
    );
  });

/* ============================================
   7.3 DESA WATULIWU / BATAS DESA
   File: Data_DesaWatuliwu.geojson
   ============================================ */

fetch("Data/Desa Watuliwu.geojson")
  .then((res) => {
    if (!res.ok) {
      throw new Error(
        "Data_DesaWatuliwu.geojson tidak ditemukan"
      );
    }
    return res.json();
  })
  .then((data) => {
    const geojsonDesaWatuliwu = L.geoJSON(data, {

      /* STYLE BATAS DESA */
      style: styleDesaWatuliwu,

      /* POPUP */
      onEachFeature: (feature, layer) => {
        const p =
          feature.properties || {};
        const namaDesa =
          p.NAMOBJ || p.WADMKD || "Watuliwu";

          p.search_name = namaDesa;

        const kecamatan =
          p.WADMKC || "-";
        const kabupaten =
          p.WADMKK || "-";
        const provinsi =
          p.WADMPR || "-";
        const luas =
          p.LUAS ?? "-";
        const sumber =
          p.UUPP || "-";

        layer.bindPopup(
          `<b>DESA WATULIWU</b><br><br>` +
          `Nama Desa: ${namaDesa}<br>` +
          `Kecamatan: ${kecamatan}<br>` +
          `Kabupaten: ${kabupaten}<br>` +
          `Provinsi: ${provinsi}<br>` +
          `Luas: ${luas} ha<br>` +
          `Sumber: ${sumber}`
        );

        /* TOOLTIP */
        layer.bindTooltip(
          namaDesa,
          {
            sticky: true
          }
        );
      }
    });

    /* MASUKKAN KE LAYER GROUP DESA WATULIWU */
    geojsonDesaWatuliwu.addTo(
      layerDesaWatuliwu
    );
    geojsonDesaWatuliwu.addTo(layerCari);
    map.fitBounds(
  geojsonDesaWatuliwu.getBounds(),
  {
    padding: [20, 20]
  }
);
  })
  .catch((err) => {
    console.error(
      "Gagal load Desa Watuliwu:",
      err
    );
  });

/* ============================================
   7.4 JALAN
   File: Data/Jalan.geojson
   ============================================ */

fetch("Data/Jalan.geojson")
  .then((res) => {
    if (!res.ok) {
      throw new Error(
        "Data/Jalan.geojson tidak ditemukan"
      );
    }
    return res.json();
  })
  .then((data) => {
    console.log("Data Jalan berhasil dibaca:", data);
    const geojsonJalan = L.geoJSON(data, {

      /* STYLE JALAN */
      style: styleJalan,

      /* POPUP & TOOLTIP */
      onEachFeature: (feature, layer) => {
        const p = feature.properties || {};

        /* BACA FIELD SESUAI GEOJSON */
        const namaObj =
          p.Nama_Obj || "Jalan Desa";

          p.search_name = namaObj;

        const panjang =
          p.Panjang ?? "-";
        const id =
          p.Id ?? "-";

        /* POPUP */
        layer.bindPopup(
          `<b>INFORMASI JALAN</b><br><br>` +
          `Nama Objek: ${namaObj}<br>` +
          `Panjang: ${panjang} km<br>` +
          `ID: ${id}`
        );

        /* TOOLTIP */
        layer.bindTooltip(
          namaObj,
          {
            sticky: true
          }
        );
      }
    });

    /* MASUKKAN KE LAYER JALAN */
    geojsonJalan.addTo(layerJalan);
    geojsonJalan.addTo(layerCari);
    console.log(
      "Jumlah fitur Jalan:",
      data.features?.length
    );
  })
  .catch((err) => {
    console.error(
      "Gagal load Jalan:",
      err
    );
  });

/* ============================================
   7.5 MASUKKAN SEMUA LAYER KE PETA
   ============================================ */

layerAsetDesa.addTo(map);
layerTopografi.addTo(map);
layerDesaWatuliwu.addTo(map);
layerJalan.addTo(map);

/* ============================================
   8. LAYER CONTROL
   ============================================ */

const layersControl = L.control.layers(
  /* BASEMAP */
  {
    "OpenStreetMap": osm,
    "Google Satellite": gogleSat,
    "Google Map": gogleMap
  },

  /* OVERLAY */
  {
    "Aset Desa": layerAsetDesa,
    "Jalan": layerJalan,
    "Topografi": layerTopografi,
    "Desa Watuliwu": layerDesaWatuliwu,
    "GeoTiff": geotiffLayer
  }
).addTo(map);

/* ============================================
   9. LEGENDA PETA
   ============================================ */

const legend = L.control({
  position: "topleft"
});
legend.onAdd = function (map) {
  const div = L.DomUtil.create(
    "div",
    "info legend"
  );
  let html = `
    <h4>LEGENDA</h4>

    <!-- TOPOGRAFI -->
    <div class="legend-title">
      Topografi / Ketinggian
    </div>
    <div>
      <span class="legend-box"
        style="background:#006400;"></span>
      0 - 50 Meter
    </div>
    <div>
      <span class="legend-box"
        style="background:#32CD32;"></span>
      50 - 100 Meter
    </div>
    <div>
      <span class="legend-box"
        style="background:#FFD700;"></span>
      100 - 200 Meter
    </div>
    <div>
      <span class="legend-box"
        style="background:#FFA500;"></span>
      200 - 500 Meter
    </div>
    <div>
      <span class="legend-box"
        style="background:#FF0000;"></span>
      500 - 1000 Meter
    </div>
    <div>
      <span class="legend-box"
        style="background:#800080;"></span>
      >1000 Meter
    </div>

    <!-- ASET DESA -->
    <div class="legend-title">
      Aset Desa
    </div>
    <div>
      <span class="legend-box"
        style="background:#28c733;"></span>
      Ibadah
    </div>
    <div>
      <span class="legend-box"
        style="background:#3b82f6;"></span>
      Pendidikan
    </div>
    <div>
      <span class="legend-box"
        style="background:#f59e0b;"></span>
      Perdagangan &amp; Jasa
    </div>
    <div>
      <span class="legend-box"
        style="background:#b21515;"></span>
      Pemerintahan
    </div>

    <!-- LANDCOVER / GEOTIFF -->
    <div class="legend-title">
      GeoTiff
    </div>
  `;

  [2, 7, 5, 11].forEach((k) => {
    if (kelasLandcover[k]) {
      html += `
        <div>
          <span class="legend-box"
            style="background:${kelasLandcover[k].warna};">
          </span>
          ${kelasLandcover[k].nama}
        </div>
      `;
    }
  });

  /* JALAN */
  html += `
    <div class="legend-title">
      Jaringan Jalan
    </div>
    <div>
      <span class="legend-line jalan"></span>
      <span class="legend-text">
        Jalan Desa
      </span>
    </div>

    <!-- BATAS DESA -->
    <div class="legend-title">
      Batas Administrasi
    </div>
    <div>
      <span class="legend-line batas"></span>
      <span class="legend-text">
        Batas Desa Watuliwu
      </span>
    </div>
  `;

  div.innerHTML = html;
  return div;
};
legend.addTo(map);

//Measurement tool

L.Marker.mergeOptions({ autoPanOnFocus: false });

const measureControl = new L.Control.Measure({
  position: "topright", // tambahan: agar tidak menumpuk dengan layer control
  primaryLengthUnit: "meters",
  secondaryLengthUnit: "kilometers",
  primaryAreaUnit: "sqmeters",
  secondaryAreaUnit: "hectares", // tambahan: sesuai slide, satuan hektar (ha)
  activeColor: "#6366f1",
  completedColor: "#10b981",
});

measureControl.addTo(map);

map.on("measurestart", () => {
  sedangMengukur = true;
});
map.on("measurefinish", () => {
  sedangMengukur = false;
});

let sedangMengukur = false; // diatur oleh plugin Measure (bagian 10)

/* ============================================
   SEARCH LAYER
   Menggabungkan semua layer yang bisa dicari
   ============================================ */

const layerCari = L.layerGroup();

/* ============================================
   SEARCH BAR
   MENCARI SEMUA DATA
   ============================================ */

const searchControl = new L.Control.Search({
  layer: layerCari,
  propertyName: "search_name",
  zoom: 17,
  initial: false,
  marker: false,
  textPlaceholder: "Cari data peta...",
  animateLocation: true
});
map.addControl(searchControl);


