import { readFile } from "node:fs/promises";
import path from "node:path";

import { PageHeader } from "@/smc/components/layout/page-header";
import { WardRiskMap } from "@/smc/components/maps/ward-risk-map";
import { getHospitalOverviewRows, getWardHealthRows } from "@/smc/lib/data/queries";

type PolygonFeature = {
  type: "Feature";
  properties: {
    ward: number;
  };
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
};

type GeoJsonCollection = {
  type: "FeatureCollection";
  features: PolygonFeature[];
};

async function getWardGeoJson() {
  const filePath = path.join(
    process.cwd(),
    "Samved_essential_data",
    "solapur_maps.geojson",
  );
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as GeoJsonCollection;
}

export default async function WardRiskMapPage() {
  const [wards, hospitals, geoJson] = await Promise.all([
    getWardHealthRows(),
    getHospitalOverviewRows(),
    getWardGeoJson(),
  ]);

  const hospitalCounts = hospitals.reduce<Record<number, number>>((accumulator, hospital) => {
    const ward = wards.find((item) => item.wardName === hospital.wardName);
    if (!ward) {
      return accumulator;
    }

    accumulator[ward.wardId] = (accumulator[ward.wardId] ?? 0) + 1;
    return accumulator;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ward Risk Map"
        description="Live Solapur ward polygons rendered from official geometry boundaries and shaded by the latest Health Index risk level."
      />

      <WardRiskMap
        wards={wards}
        hospitalCounts={hospitalCounts}
        features={geoJson.features}
      />
    </div>
  );
}

