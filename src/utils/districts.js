const districtDefinitions = [
  { id: 'downtown', legacyLabels: ['Downtown / Wust El-Balad'] },
  { id: 'abdeen', legacyLabels: ['Abdeen'] },
  { id: 'azbakeya', legacyLabels: ['Azbakeya'] },
  { id: 'bab_elshaareya', legacyLabels: ["Bab El-Sha'reya"] },
  { id: 'gamaliya', legacyLabels: ['El-Gamaliya'] },
  { id: 'mosky', legacyLabels: ['El-Mosky'] },
  { id: 'darb_el_ahmar', legacyLabels: ['El-Darb El-Ahmar'] },
  { id: 'khalifa', legacyLabels: ['El-Khalifa'] },
  { id: 'sayeda_zeinab', legacyLabels: ['El-Sayeda Zeinab'] },
  { id: 'zamalek', legacyLabels: ['Zamalek'] },
  { id: 'garden_city', legacyLabels: ['Garden City'] },
  { id: 'bulaq', legacyLabels: ['Bulaq'] },
  { id: 'shubra', legacyLabels: ['Shubra'] },
  { id: 'rod_elfarag', legacyLabels: ['Rod El-Farag'] },
  { id: 'sharabiya', legacyLabels: ['El-Sharabiya'] },
  { id: 'zawya_el_hamra', legacyLabels: ['El-Zawya El-Hamra'] },
  { id: 'wayli', legacyLabels: ['El-Wayli'] },
  { id: 'abbassia', legacyLabels: ['Abbassia'] },
  { id: 'heliopolis', legacyLabels: ['Heliopolis / Masr El-Gedida'] },
  { id: 'nasr_city', legacyLabels: ['Nasr City'] },
  { id: 'ain_shams', legacyLabels: ['Ain Shams'] },
  { id: 'matareya', legacyLabels: ['El-Matareya'] },
  { id: 'marg', legacyLabels: ['El-Marg'] },
  { id: 'salam', legacyLabels: ['El-Salam'] },
  { id: 'maadi', legacyLabels: ['Maadi'] },
  { id: 'old_cairo', legacyLabels: ['Misr El-Kadima / Old Cairo'] },
  { id: 'basatin', legacyLabels: ['Basatin'] },
  { id: 'helwan', legacyLabels: ['Helwan'] },
  { id: 'may_15_city', legacyLabels: ['15th of May City'] },
  { id: 'tura', legacyLabels: ['Tura'] },
  { id: 'new_cairo', legacyLabels: ['New Cairo / El-Tagammu'] },
  { id: 'rehab_city', legacyLabels: ['Rehab City'] },
  { id: 'madinaty', legacyLabels: ['Madinaty'] },
  { id: 'shorouk_city', legacyLabels: ['Shorouk City'] },
  { id: 'obour_city', legacyLabels: ['Obour City'] },
  { id: 'badr_city', legacyLabels: ['Badr City'] },
  { id: 'dokki', legacyLabels: ['Dokki'] },
  { id: 'mohandessin', legacyLabels: ['Mohandessin'] },
  { id: 'agouza', legacyLabels: ['Agouza'] },
  { id: 'imbaba', legacyLabels: ['Imbaba'] },
  { id: 'bulaq_el_dakrour', legacyLabels: ['Bulaq El-Dakrour'] },
  { id: 'haram', legacyLabels: ['El-Haram'] },
  { id: 'faisal', legacyLabels: ['Faisal'] },
  { id: 'omraniya', legacyLabels: ['El-Omraniya'] },
  { id: 'giza', legacyLabels: ['Giza'] },
  { id: 'october_6_city', legacyLabels: ['6th of October City'] },
  { id: 'sheikh_zayed', legacyLabels: ['Sheikh Zayed'] },
  { id: 'hadayek_el_ahram', legacyLabels: ['Hadayek El-Ahram'] },
]

const districtLookup = new Map()

const normalizeDistrictKey = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')

for (const district of districtDefinitions) {
  districtLookup.set(normalizeDistrictKey(district.id), district.id)
  for (const label of district.legacyLabels) {
    districtLookup.set(normalizeDistrictKey(label), district.id)
  }
}

export const buildDistrictOptions = (t) =>
  districtDefinitions.map((district) => ({
    label: t(`districts.${district.id}`),
    value: district.id,
  }))

export const normalizeDistrictValue = (value) => {
  if (!value) return null
  return districtLookup.get(normalizeDistrictKey(value)) || String(value)
}

export const getDistrictLabel = (value, t) => {
  const districtId = normalizeDistrictValue(value)
  if (!districtId) return ''
  const translatedLabel = t(`districts.${districtId}`)
  return translatedLabel !== `districts.${districtId}` ? translatedLabel : String(value)
}
