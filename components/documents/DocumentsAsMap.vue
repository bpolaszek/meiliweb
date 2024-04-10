<template>
  <main class="grid h-full grid-cols-12 overflow-hidden">
    <div
      class="col-span-3 h-full space-y-6 overflow-y-auto overflow-x-hidden px-4 pb-4">
      <DocumentCard
        v-for="document of documents"
        :indexUid="indexUid"
        :document
        :primary-key="primaryKey"
        :key="document[primaryKey]"
        :id="`document-${document[primaryKey]}`"
        class="w-full" />
    </div>
    <MapContainer
      :center="center"
      :zoom="2"
      class="col-span-9 size-full"
      style="height: 100%; z-index: 0"
      @zoomend="onZoomEnd">
      <OpenStreetMap>
        <ScaleControl />
        <template v-for="document of documents">
          <Marker
            v-if="Object.keys(document).includes('_geo')"
            :position="document._geo"
            :icon
            @click="scrollToDocument(document)">
            <Popup>{{ document[nameField] }}</Popup>
          </Marker>
        </template>
      </OpenStreetMap>
    </MapContainer>
  </main>
</template>

<script setup lang="ts">
import DocumentCard from './DocumentCard.vue'
import {
  MapContainer,
  Marker,
  OpenStreetMap,
  Popup,
  ScaleControl,
} from 'vue3-leaflet'
import { useFields } from '~/composables'
import { AppliedFilters } from '~/utils'

type Props = {
  indexUid: string
  primaryKey: string
  documents: Array<any>
  fields: Array<string>
  appliedFilters: AppliedFilters
  canFilterGeoDocuments: boolean
}

type ZoomEndEvent = {
  bounds: {
    _northEast: {
      lat: number
      lng: number
    }
    _southWest: {
      lat: number
      lng: number
    }
  }
}

const props = defineProps<Props>()
const { nameField } = useFields(props.primaryKey, props.fields)
const center = ref([0, 0])
const scrollToDocument = (doc: any) => {
  document
    .getElementById(`document-${doc[props.primaryKey]}`)
    ?.scrollIntoView({ behavior: 'smooth' })
}
const onZoomEnd = ({ bounds }: ZoomEndEvent) => {
  if (!props.canFilterGeoDocuments) {
    return
  }
  const boundingBox = {
    topLeftCorner: Object.values(bounds._northEast) as [number, number],
    bottomRightCorner: Object.values(bounds._southWest) as [number, number],
  }
  props.appliedFilters.applyBoundingBox(boundingBox)
}

const icon = {
  iconUrl: '/pin.svg',
  iconSize: [38, 95],
  iconAnchor: [22, 60],
  popupAnchor: [0, -30],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowAnchor: [11, 40],
}
</script>
