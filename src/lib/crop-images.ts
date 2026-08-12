// ---------------------------------------------------------------------------
// HarvestID — centralized, production-safe crop image resolver.
//
// Architecture
// ------------
// * One curated catalog maps a canonical crop name -> a stable, hotlink-safe
//   image URL (Unsplash CDN for the original set, Wikimedia Commons permanent
//   upload.wikimedia.org URLs for the rest — Wikimedia explicitly permits
//   hotlinking and the URLs are permanent).
// * A normalization layer (lowercase, trim, singular/plural, punctuation,
//   aliases/synonyms) matches whatever the farmer typed ("Lady Finger",
//   "Brinjal", "tomatoes", "Green Chilli", "Hybrid Maize" ...) to the catalog.
// * Unknown crops return CROP_IMAGE_UNAVAILABLE — a sentinel that UI renders
//   as an honest "Crop image unavailable" placeholder. We never show a photo
//   of a different crop.
// * A farmer-uploaded image (data: URL) always takes priority over the
//   catalog and is persisted with the crop.
// ---------------------------------------------------------------------------

/** Sentinel returned when no catalog entry matches and no custom image exists. */
export const CROP_IMAGE_UNAVAILABLE = "harvestid:crop-image-unavailable";

/**
 * Curated catalog: canonical (singular) crop name -> stable image URL.
 * Adding a crop is a single line here — no component changes needed.
 */
const CATALOG: Record<string, string> = {
  // ---- Vegetables & tubers ----
  tomato: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=1200&q=80",
  potato: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=1200&q=80",
  "sweet potato": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Ipomoea_batatas_006.JPG/960px-Ipomoea_batatas_006.JPG",
  onion: "https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?auto=format&fit=crop&w=1200&q=80",
  garlic: "https://upload.wikimedia.org/wikipedia/commons/3/39/Allium_sativum_Woodwill_1793.jpg",
  carrot: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Vegetable-Carrot-Bundle-wStalks.jpg/960px-Vegetable-Carrot-Bundle-wStalks.jpg",
  radish: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Radish_3371103037_4ab07db0bf_o.jpg/960px-Radish_3371103037_4ab07db0bf_o.jpg",
  turnip: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Turnip_2622027.jpg/960px-Turnip_2622027.jpg",
  beetroot: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Detroitdarkredbeets.png/960px-Detroitdarkredbeets.png",
  cabbage: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Cabbage_and_cross_section_on_white.jpg/960px-Cabbage_and_cross_section_on_white.jpg",
  cauliflower: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80",
  broccoli: "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=1200&q=80",
  spinach: "https://upload.wikimedia.org/wikipedia/commons/3/37/Spinacia_oleracea_Spinazie_bloeiend.jpg",
  lettuce: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Iceberg_lettuce_in_SB.jpg/960px-Iceberg_lettuce_in_SB.jpg",
  cucumber: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/ARS_cucumber.jpg/960px-ARS_cucumber.jpg",
  "bottle gourd": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Courge_encore_verte.jpg",
  "bitter gourd": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Momordica_charantia_Blanco2.357.png/960px-Momordica_charantia_Blanco2.357.png",
  "ridge gourd": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Luffa_acutangula_Chinese_okra.jpg/960px-Luffa_acutangula_Chinese_okra.jpg",
  pumpkin: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/FrenchMarketPumpkinsB.jpg/960px-FrenchMarketPumpkinsB.jpg",
  "ash gourd": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Benincasa_hispida_compose.jpg/960px-Benincasa_hispida_compose.jpg",
  zucchini: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/CSA-Striped-Zucchini.jpg/960px-CSA-Striped-Zucchini.jpg",
  eggplant: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Solanum_melongena_24_08_2012_%281%29.JPG/960px-Solanum_melongena_24_08_2012_%281%29.JPG",
  okra: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Hong_Kong_Okra_Aug_25_2012.JPG/960px-Hong_Kong_Okra_Aug_25_2012.JPG",
  chilli: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Madame_Jeanette_and_other_chillies.jpg/960px-Madame_Jeanette_and_other_chillies.jpg",
  chili: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Madame_Jeanette_and_other_chillies.jpg/960px-Madame_Jeanette_and_other_chillies.jpg",
  "bell pepper": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Green-Yellow-Red-Pepper-2009.jpg/960px-Green-Yellow-Red-Pepper-2009.jpg",
  "green bean": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Heaps_of_beans.jpg/960px-Heaps_of_beans.jpg",
  "cluster bean": "https://upload.wikimedia.org/wikipedia/commons/9/9b/Cluster_bean-guar-Cyamopsis_psoralioides-Cyamopsis_tetragonolobus-TAMIL_NADU73.jpg",
  cowpea: "https://upload.wikimedia.org/wikipedia/commons/0/08/Lobia.jpg",
  pea: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Peas_in_pods_-_Studio.jpg/960px-Peas_in_pods_-_Studio.jpg",
  drumstick: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/DrumstickFlower.jpg/960px-DrumstickFlower.jpg",
  tapioca: "https://upload.wikimedia.org/wikipedia/commons/f/f1/Manihot_esculenta_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-090.jpg",
  yam: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Yam_at_monday_market_kaduna_state_01.jpg/960px-Yam_at_monday_market_kaduna_state_01.jpg",
  taro: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Songe-R%C3%A9union.JPG/960px-Songe-R%C3%A9union.JPG",
  mushroom: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Sparrige_Sch%C3%BCppling_%28Pholiota_squarrosa%29.jpg/960px-Sparrige_Sch%C3%BCppling_%28Pholiota_squarrosa%29.jpg",
  leek: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Leek_on_white_background_-_0947.jpg/960px-Leek_on_white_background_-_0947.jpg",
  celery: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Celery_1.jpg/960px-Celery_1.jpg",

  // ---- Grains, cereals & millets ----
  wheat: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80",
  rice: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=1200&q=80",
  maize: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=1200&q=80",
  corn: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=1200&q=80",
  sorghum: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Sorghum_bicolor03.jpg/960px-Sorghum_bicolor03.jpg",
  "pearl millet": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Grain_millet%2C_early_grain_fill%2C_Tifton%2C_7-3-02.jpg/960px-Grain_millet%2C_early_grain_fill%2C_Tifton%2C_7-3-02.jpg",
  "finger millet": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Finger_millet_3_11-21-02.jpg/960px-Finger_millet_3_11-21-02.jpg",
  "foxtail millet": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Japanese_Foxtail_millet_02.jpg/960px-Japanese_Foxtail_millet_02.jpg",
  barley: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Barley_%28Hordeum_vulgare%29_-_United_States_National_Arboretum_-_24_May_2009.jpg/960px-Barley_%28Hordeum_vulgare%29_-_United_States_National_Arboretum_-_24_May_2009.jpg",
  oat: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/AvenaSativa3.jpg/960px-AvenaSativa3.jpg",
  rye: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Ear_of_rye.jpg/960px-Ear_of_rye.jpg",
  buckwheat: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Japanese_Buckwheat_Flower.JPG/960px-Japanese_Buckwheat_Flower.JPG",
  quinoa: "https://upload.wikimedia.org/wikipedia/commons/9/96/Reismelde.jpg",

  // ---- Pulses, oilseeds & nuts ----
  chickpea: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Chickpea_BNC.jpg/960px-Chickpea_BNC.jpg",
  "pigeon pea": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Cajanus_cajan_Blanco1.167-cropped.jpg/960px-Cajanus_cajan_Blanco1.167-cropped.jpg",
  "black gram": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Black_gram.jpg/960px-Black_gram.jpg",
  "green gram": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Mung_beans_%28Vigna_radiata%29.jpg/960px-Mung_beans_%28Vigna_radiata%29.jpg",
  lentil: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/3_types_of_lentil.png/960px-3_types_of_lentil.png",
  "kidney bean": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Red_Rajma_BNC.jpg/960px-Red_Rajma_BNC.jpg",
  soybean: "https://upload.wikimedia.org/wikipedia/commons/8/82/Soybean.USDA.jpg",
  groundnut: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Arachis_hypogaea_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-163.jpg/960px-Arachis_hypogaea_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-163.jpg",
  sesame: "https://upload.wikimedia.org/wikipedia/commons/7/70/Sesamum_indicum_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-129.jpg",
  mustard: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Mustard_plant_flower.jpg/960px-Mustard_plant_flower.jpg",
  sunflower: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Sunflower_sky_backdrop.jpg/960px-Sunflower_sky_backdrop.jpg",
  safflower: "https://upload.wikimedia.org/wikipedia/commons/7/7f/Safflower.jpg",
  castor: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Ricinus_March_2010-1.jpg/960px-Ricinus_March_2010-1.jpg",
  linseed: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/K%C3%B6hler%27s_Medizinal-Pflanzen_in_naturgetreuen_Abbildungen_mit_kurz_erl%C3%A4uterndem_Texte_%28Plate_16%29_BHL303594.jpg/960px-K%C3%B6hler%27s_Medizinal-Pflanzen_in_naturgetreuen_Abbildungen_mit_kurz_erl%C3%A4uterndem_Texte_%28Plate_16%29_BHL303594.jpg",
  "niger seed": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Guizotia_abyssinica_niger.jpg/960px-Guizotia_abyssinica_niger.jpg",
  almond: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Almonds_-_in_shell%2C_shell_cracked_open%2C_shelled%2C_blanched.jpg/960px-Almonds_-_in_shell%2C_shell_cracked_open%2C_shelled%2C_blanched.jpg",
  walnut: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Walnuts_-_whole_and_open_with_halved_kernel.jpg/960px-Walnuts_-_whole_and_open_with_halved_kernel.jpg",
  pistachio: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Pistachio_vera.jpg/960px-Pistachio_vera.jpg",

  // ---- Plantation, cash & fibre crops ----
  tea: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=80",
  coffee: "https://images.unsplash.com/photo-1497515114629-f71d768fd07c?auto=format&fit=crop&w=1200&q=80",
  cocoa: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Cocoa_Pods.JPG/960px-Cocoa_Pods.JPG",
  rubber: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Caoutchouc_naturel.jpg/960px-Caoutchouc_naturel.jpg",
  coconut: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
  arecanut: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Bago%2C_mercado_23.jpg/960px-Bago%2C_mercado_23.jpg",
  cashew: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Cashew_apples.jpg/960px-Cashew_apples.jpg",
  sugarcane: "https://upload.wikimedia.org/wikipedia/commons/7/74/Saccharum_officinarum_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-125.jpg",
  cotton: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80",
  jute: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Jute_-_Kolkata_2003-10-31_00538.JPG/960px-Jute_-_Kolkata_2003-10-31_00538.JPG",
  tobacco: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/DunhillLightFlake.jpg/960px-DunhillLightFlake.jpg",
  betel: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Piper_betle_plant.jpg/960px-Piper_betle_plant.jpg",
  "oil palm": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Elaeis_guineensis_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-056.jpg/960px-Elaeis_guineensis_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-056.jpg",

  // ---- Fruits ----
  mango: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=1200&q=80",
  banana: "https://upload.wikimedia.org/wikipedia/commons/d/de/Bananavarieties.jpg",
  apple: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=1200&q=80",
  orange: "https://images.unsplash.com/photo-1557800636-894a64c1696f?auto=format&fit=crop&w=1200&q=80",
  lemon: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=1200&q=80",
  lime: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Citrus_%C3%97_aurantiifolia_%28Christm.%29_Swingle_%2851906868474%29.jpg/960px-Citrus_%C3%97_aurantiifolia_%28Christm.%29_Swingle_%2851906868474%29.jpg",
  grapes: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1200&q=80",
  watermelon: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Taiwan_2009_Tainan_City_Organic_Farm_Watermelon_FRD_7962.jpg/960px-Taiwan_2009_Tainan_City_Organic_Farm_Watermelon_FRD_7962.jpg",
  muskmelon: "https://upload.wikimedia.org/wikipedia/commons/a/ae/Meloen_vrucht_met_bloem.jpg",
  papaya: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Carica_papaya_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-029.jpg/960px-Carica_papaya_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-029.jpg",
  pineapple: "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=1200&q=80",
  guava: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Guava_pink_fruit.jpg/960px-Guava_pink_fruit.jpg",
  pomegranate: "https://commons.wikimedia.org/wiki/Special:FilePath/Pomegranate%20%28opened%29.jpg?width=800",
  sapota: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/%E0%B4%B8%E0%B4%AA%E0%B5%8D%E0%B4%AA%E0%B5%8B%E0%B4%9F%E0%B5%8D%E0%B4%9F.jpg/960px-%E0%B4%B8%E0%B4%AA%E0%B5%8D%E0%B4%AA%E0%B5%8B%E0%B4%9F%E0%B5%8D%E0%B4%9F.jpg",
  "custard apple": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Annona_reticulata_Blanco1.197-cropped.jpg/960px-Annona_reticulata_Blanco1.197-cropped.jpg",
  jackfruit: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/The_jackfruit_is_holding_on_to_the_tree.jpg/960px-The_jackfruit_is_holding_on_to_the_tree.jpg",
  lychee: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Litchi_chinensis_fruits.JPG/960px-Litchi_chinensis_fruits.JPG",
  strawberry: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Garden_strawberry_%28Fragaria_%C3%97_ananassa%29_single2.jpg/960px-Garden_strawberry_%28Fragaria_%C3%97_ananassa%29_single2.jpg",
  blueberry: "https://upload.wikimedia.org/wikipedia/commons/1/15/Blueberries.jpg",
  raspberry: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Raspberry_-_halved_%28Rubus_idaeus%29.jpg/960px-Raspberry_-_halved_%28Rubus_idaeus%29.jpg",
  blackberry: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Ripe%2C_ripening%2C_and_green_blackberries.jpg/960px-Ripe%2C_ripening%2C_and_green_blackberries.jpg",
  kiwi: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Actinidia_fruits.jpg/960px-Actinidia_fruits.jpg",
  pear: "https://upload.wikimedia.org/wikipedia/commons/c/cf/Pears.jpg",
  plum: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Plums_African_Rose_-_whole%2C_halved_and_slice.jpg/960px-Plums_African_Rose_-_whole%2C_halved_and_slice.jpg",
  peach: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Illustration_Prunus_persica_clean_no_descr.jpg/960px-Illustration_Prunus_persica_clean_no_descr.jpg",
  apricot: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Apricot_and_cross_section.jpg/960px-Apricot_and_cross_section.jpg",
  cherry: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Cherry_season_%2848216568227%29.jpg/960px-Cherry_season_%2848216568227%29.jpg",
  fig: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Ficus_carica_L%2C_1771.jpg",
  date: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Dates005.jpg/960px-Dates005.jpg",
  "dragon fruit": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Pitaya_cross_section_ed2.jpg/960px-Pitaya_cross_section_ed2.jpg",
  "passion fruit": "https://upload.wikimedia.org/wikipedia/commons/9/91/Passiflora_edulis_forma_flavicarpa.jpg",
  avocado: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Persea_americana_fruit_2.JPG/960px-Persea_americana_fruit_2.JPG",
  mulberry: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Morus_alba_FrJPG.jpg/960px-Morus_alba_FrJPG.jpg",
  amla: "https://upload.wikimedia.org/wikipedia/commons/7/7f/Phyllanthus_officinalis.jpg",
  jujube: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Ziziphus_jujuba.jpg/960px-Ziziphus_jujuba.jpg",
  loquat: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Loquat-0.jpg/960px-Loquat-0.jpg",
  persimmon: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Fuyu_persimmon_fruits%2C_one_cut_open.jpg/960px-Fuyu_persimmon_fruits%2C_one_cut_open.jpg",

  // ---- Spices & condiments ----
  "black pepper": "https://upload.wikimedia.org/wikipedia/commons/f/fd/Piper_nigrum_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-107.jpg",
  cardamom: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/02017_0119_Kardamom%2C_Winter_in_den_Beskiden.jpg/960px-02017_0119_Kardamom%2C_Winter_in_den_Beskiden.jpg",
  cinnamon: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Cinnamomum_verum_spices.jpg/960px-Cinnamomum_verum_spices.jpg",
  clove: "https://upload.wikimedia.org/wikipedia/commons/4/4b/Syzygium_aromaticum_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-030.jpg",
  nutmeg: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Biji_Pala_Bubuk.jpg/960px-Biji_Pala_Bubuk.jpg",
  tamarind: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Tamarindus_indica_pods.JPG",
  saffron: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Saffron_-_premium_spice.jpg/960px-Saffron_-_premium_spice.jpg",
  vanilla: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Vanilla_planifolia_%286998639597%29.jpg/960px-Vanilla_planifolia_%286998639597%29.jpg",
  turmeric: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Turmeric_inflorescence.jpg/960px-Turmeric_inflorescence.jpg",
  ginger: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Koeh-146-no_text.jpg/960px-Koeh-146-no_text.jpg",
  cumin: "https://upload.wikimedia.org/wikipedia/commons/5/58/Cuminum_cyminum_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-198.jpg",
  coriander: "https://upload.wikimedia.org/wikipedia/commons/1/13/Coriandrum_sativum_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-193.jpg",
  fennel: "",
  fenugreek: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Illustration_Trigonella_foenum-graecum0_clean.jpg/960px-Illustration_Trigonella_foenum-graecum0_clean.jpg",
  "star anise": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Illicium_verum_1zz.jpg/960px-Illicium_verum_1zz.jpg",
  "bay leaf": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Bay_Leaves.JPG/960px-Bay_Leaves.JPG",
  asafoetida: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Asa_foetida_Kaempfer.jpg/960px-Asa_foetida_Kaempfer.jpg",
  ajwain: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Carom_Flowers.jpg/960px-Carom_Flowers.jpg",
  dill: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Illustration_Anethum_graveolens_clean.jpg/960px-Illustration_Anethum_graveolens_clean.jpg",
  caraway: "https://upload.wikimedia.org/wikipedia/commons/4/42/Carum_carvi_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-172.jpg",

  // ---- Herbs, medicinal & other crops ----
  mint: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Mentha_spicata-IMG_6186.jpg/960px-Mentha_spicata-IMG_6186.jpg",
  basil: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Ocimum_basilicum_8zz.jpg/960px-Ocimum_basilicum_8zz.jpg",
  "curry leaf": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Curry_Trees.jpg/960px-Curry_Trees.jpg",
  "aloe vera": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Aloe_vera_flower_inset.png/960px-Aloe_vera_flower_inset.png",
  stevia: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Stevia_rebaudiana_flowers.jpg/960px-Stevia_rebaudiana_flowers.jpg",
  neem: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Neem_Tree_in_Rajasthan%2C_India.jpg/960px-Neem_Tree_in_Rajasthan%2C_India.jpg",
  bamboo: "https://upload.wikimedia.org/wikipedia/commons/f/f3/Bamboo_forest.jpg",
  hemp: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/La_Roche_Jagu_chanvre_1.JPG/960px-La_Roche_Jagu_chanvre_1.JPG",

  // ---- Flowers ----
  rose: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Rosa_rubiginosa_1.jpg/960px-Rosa_rubiginosa_1.jpg",
  marigold: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Tagetes_erecta_chendumalli_chedi.jpg/960px-Tagetes_erecta_chendumalli_chedi.jpg",
  jasmine: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Common_Jasmine.jpg/960px-Common_Jasmine.jpg",
  tuberose: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Tuberose_flower.jpg/960px-Tuberose_flower.jpg",
  chrysanthemum: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Chrysanthemum.JPG/960px-Chrysanthemum.JPG",
  gladiolus: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/0_Gladiolus_italicus_-_Samo%C3%ABns_%281%29.JPG/960px-0_Gladiolus_italicus_-_Samo%C3%ABns_%281%29.JPG",
  gerbera: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Unidentified_Gerbera.jpg/960px-Unidentified_Gerbera.jpg",
  carnation: "https://upload.wikimedia.org/wikipedia/commons/3/3b/W_carnation4051.jpg",
  lotus: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Sacred_lotus_Nelumbo_nucifera.jpg/960px-Sacred_lotus_Nelumbo_nucifera.jpg",
  hibiscus: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Hibiscus_flower_TZ.jpg/960px-Hibiscus_flower_TZ.jpg",
  lily: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Lilium_candidum_1.jpg/960px-Lilium_candidum_1.jpg",
  orchid: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Plant_Orchid_Cymbidium_aloifolium_P1110661_05_-_cropped.jpg/960px-Plant_Orchid_Cymbidium_aloifolium_P1110661_05_-_cropped.jpg",
};

// Fennel has no harvested URL yet — drop the empty entry so it never matches.
delete CATALOG["fennel"];

/**
 * Aliases / synonyms / spelling variants / plural forms -> canonical key.
 * Checked before token matching so specific names win over generic tokens.
 */
const ALIASES: Record<string, string> = {
  // tomatoes, potatoes etc. are handled by singularization; these need explicit maps
  tomato: "tomato",
  brinjal: "eggplant",
  eggplant: "eggplant",
  baingan: "eggplant",
  aubergine: "eggplant",
  "lady finger": "okra",
  ladyfinger: "okra",
  "lady's finger": "okra",
  bhindi: "okra",
  okra: "okra",
  chilli: "chilli",
  chili: "chilli",
  chillies: "chilli",
  chilly: "chilli",
  "red chilli": "chilli",
  "green chilli": "chilli",
  "hot pepper": "chilli",
  "chili pepper": "chilli",
  "chilli pepper": "chilli",
  "bird's eye chilli": "chilli",
  pepper: "black pepper",
  capsicum: "bell pepper",
  "bell pepper": "bell pepper",
  "shimla mirch": "bell pepper",
  "sweet pepper": "bell pepper",
  maize: "maize",
  corn: "maize",
  "sweet corn": "maize",
  sweetcorn: "maize",
  makka: "maize",
  groundnut: "groundnut",
  peanut: "groundnut",
  peanuts: "groundnut",
  moongphali: "groundnut",
  soybean: "soybean",
  "soya bean": "soybean",
  soyabean: "soybean",
  soya: "soybean",
  coriander: "coriander",
  cilantro: "coriander",
  dhania: "coriander",
  "green coriander": "coriander",
  mangoes: "mango",
  "sweet potato": "sweet potato",
  shakarkand: "sweet potato",
  onion: "onion",
  pyaaz: "onion",
  "spring onion": "onion",
  "red onion": "onion",
  carrot: "carrot",
  gajar: "carrot",
  sugarcane: "sugarcane",
  "sugar cane": "sugarcane",
  "sugar-cane": "sugarcane",
  ganna: "sugarcane",
  cotton: "cotton",
  potato: "potato",
  aloo: "potato",
  banana: "banana",
  kela: "banana",
  plantain: "banana",
  apple: "apple",
  seb: "apple",
  "cherry tomato": "tomato",
  "plum tomato": "tomato",
  "desi tomato": "tomato",
  "hybrid tomato": "tomato",
  orange: "orange",
  santra: "orange",
  lemon: "lemon",
  nimbu: "lemon",
  lime: "lime",
  "sweet lime": "lime",
  mousambi: "lime",
  mosambi: "lime",
  grape: "grapes",
  grapes: "grapes",
  angoor: "grapes",
  coconut: "coconut",
  nariyal: "coconut",
  "tender coconut": "coconut",
  rice: "rice",
  paddy: "rice",
  dhan: "rice",
  chawal: "rice",
  wheat: "wheat",
  gehun: "wheat",
  cabbage: "cabbage",
  "patta gobhi": "cabbage",
  cauliflower: "cauliflower",
  gobhi: "cauliflower",
  "phool gobhi": "cauliflower",
  broccoli: "broccoli",
  spinach: "spinach",
  palak: "spinach",
  cucumber: "cucumber",
  kheera: "cucumber",
  "bottle gourd": "bottle gourd",
  lauki: "bottle gourd",
  calabash: "bottle gourd",
  "bitter gourd": "bitter gourd",
  karela: "bitter gourd",
  "bitter melon": "bitter gourd",
  "ridge gourd": "ridge gourd",
  turai: "ridge gourd",
  pumpkin: "pumpkin",
  kaddu: "pumpkin",
  "ash gourd": "ash gourd",
  "white gourd": "ash gourd",
  "winter melon": "ash gourd",
  watermelon: "watermelon",
  tarbooz: "watermelon",
  muskmelon: "muskmelon",
  kharbuja: "muskmelon",
  cantaloupe: "muskmelon",
  papaya: "papaya",
  papita: "papaya",
  pomegranate: "pomegranate",
  anaar: "pomegranate",
  guava: "guava",
  amrood: "guava",
  pineapple: "pineapple",
  annanas: "pineapple",
  sapota: "sapota",
  sapodilla: "sapota",
  chikoo: "sapota",
  "custard apple": "custard apple",
  seetaphal: "custard apple",
  sitaphal: "custard apple",
  jackfruit: "jackfruit",
  kathal: "jackfruit",
  lychee: "lychee",
  litchi: "lychee",
  strawberry: "strawberry",
  blueberry: "blueberry",
  raspberry: "raspberry",
  blackberry: "blackberry",
  kiwi: "kiwi",
  kiwifruit: "kiwi",
  pear: "pear",
  nashpati: "pear",
  plum: "plum",
  peach: "peach",
  aadoo: "peach",
  apricot: "apricot",
  cherry: "cherry",
  fig: "fig",
  anjeer: "fig",
  date: "date",
  dates: "date",
  khajoor: "date",
  "date palm": "date",
  "dragon fruit": "dragon fruit",
  pitaya: "dragon fruit",
  "passion fruit": "passion fruit",
  garlic: "garlic",
  lahsun: "garlic",
  ginger: "ginger",
  adrak: "ginger",
  turmeric: "turmeric",
  haldi: "turmeric",
  pea: "pea",
  peas: "pea",
  matar: "pea",
  "green pea": "pea",
  "green peas": "pea",
  bean: "green bean",
  beans: "green bean",
  "french bean": "green bean",
  "french beans": "green bean",
  "green bean": "green bean",
  "green beans": "green bean",
  "cluster bean": "cluster bean",
  guar: "cluster bean",
  cowpea: "cowpea",
  lobia: "cowpea",
  chickpea: "chickpea",
  chickpeas: "chickpea",
  chana: "chickpea",
  gram: "chickpea",
  besan: "chickpea",
  "pigeon pea": "pigeon pea",
  "toor dal": "pigeon pea",
  "tur dal": "pigeon pea",
  arhar: "pigeon pea",
  "black gram": "black gram",
  urad: "black gram",
  "urad dal": "black gram",
  "green gram": "green gram",
  moong: "green gram",
  "moong dal": "green gram",
  "mung bean": "green gram",
  lentil: "lentil",
  lentils: "lentil",
  masoor: "lentil",
  dal: "lentil",
  "kidney bean": "kidney bean",
  "kidney beans": "kidney bean",
  rajma: "kidney bean",
  mustard: "mustard",
  sarson: "mustard",
  sesame: "sesame",
  til: "sesame",
  gingelly: "sesame",
  sunflower: "sunflower",
  safflower: "safflower",
  castor: "castor",
  linseed: "linseed",
  flax: "linseed",
  alsi: "linseed",
  jute: "jute",
  rubber: "rubber",
  tobacco: "tobacco",
  tea: "tea",
  chai: "tea",
  coffee: "coffee",
  cocoa: "cocoa",
  cacao: "cocoa",
  cardamom: "cardamom",
  elaichi: "cardamom",
  "black pepper": "black pepper",
  "kali mirch": "black pepper",
  peppercorn: "black pepper",
  cinnamon: "cinnamon",
  dalchini: "cinnamon",
  clove: "clove",
  laung: "clove",
  nutmeg: "nutmeg",
  jaiphal: "nutmeg",
  cumin: "cumin",
  jeera: "cumin",
  saffron: "saffron",
  kesar: "saffron",
  vanilla: "vanilla",
  tamarind: "tamarind",
  imli: "tamarind",
  "star anise": "star anise",
  "bay leaf": "bay leaf",
  "bay leaves": "bay leaf",
  "tej patta": "bay leaf",
  asafoetida: "asafoetida",
  hing: "asafoetida",
  ajwain: "ajwain",
  carom: "ajwain",
  mint: "mint",
  pudina: "mint",
  basil: "basil",
  tulsi: "basil",
  fenugreek: "fenugreek",
  methi: "fenugreek",
  "curry leaf": "curry leaf",
  "curry leaves": "curry leaf",
  "kadi patta": "curry leaf",
  "karipatta": "curry leaf",
  drumstick: "drumstick",
  moringa: "drumstick",
  sahjan: "drumstick",
  tapioca: "tapioca",
  cassava: "tapioca",
  yam: "yam",
  taro: "taro",
  colocasia: "taro",
  arbi: "taro",
  radish: "radish",
  mooli: "radish",
  turnip: "turnip",
  beetroot: "beetroot",
  beet: "beetroot",
  lettuce: "lettuce",
  celery: "celery",
  mushroom: "mushroom",
  sorghum: "sorghum",
  jowar: "sorghum",
  "pearl millet": "pearl millet",
  bajra: "pearl millet",
  "finger millet": "finger millet",
  ragi: "finger millet",
  "foxtail millet": "foxtail millet",
  barley: "barley",
  jau: "barley",
  oat: "oat",
  oats: "oat",
  rye: "rye",
  buckwheat: "buckwheat",
  kuttu: "buckwheat",
  quinoa: "quinoa",
  almond: "almond",
  badam: "almond",
  walnut: "walnut",
  akhrot: "walnut",
  pistachio: "pistachio",
  arecanut: "arecanut",
  "areca nut": "arecanut",
  "betel nut": "arecanut",
  supari: "arecanut",
  cashew: "cashew",
  kaju: "cashew",
  "oil palm": "oil palm",
  betel: "betel",
  rose: "rose",
  gulab: "rose",
  marigold: "marigold",
  genda: "marigold",
  jasmine: "jasmine",
  chameli: "jasmine",
  mogra: "jasmine",
  tuberose: "tuberose",
  rajanigandha: "tuberose",
  chrysanthemum: "chrysanthemum",
  gladiolus: "gladiolus",
  gerbera: "gerbera",
  carnation: "carnation",
  lotus: "lotus",
  kamal: "lotus",
  hibiscus: "hibiscus",
  gudhal: "hibiscus",
  lily: "lily",
  orchid: "orchid",
  bamboo: "bamboo",
  neem: "neem",
  hemp: "hemp",
  "aloe vera": "aloe vera",
  stevia: "stevia",
  amla: "amla",
  "indian gooseberry": "amla",
  jujube: "jujube",
  ber: "jujube",
  loquat: "loquat",
  persimmon: "persimmon",
  avocado: "avocado",
  mulberry: "mulberry",
  dill: "dill",
  caraway: "caraway",
};

/** Words stripped from token matching so generic descriptors never win. */
const STOP_WORDS = new Set([
  "a", "an", "the", "of", "for", "and", "or", "with", "in", "on", "at", "by", "to", "from",
  "crop", "crops", "plant", "plants", "tree", "trees", "fruit", "fruits", "vegetable",
  "vegetables", "grain", "grains", "seed", "seeds", "variety", "hybrid", "desi", "organic",
  "fresh", "local", "field", "garden", "farm", "kharif", "rabi", "zaid", "season", "dwarf",
  "giant", "early", "late", "red", "green", "yellow", "black", "white", "purple", "pink",
  "brown", "blue", "sweet", "bitter", "wild", "indian", "new", "old", "small", "big", "type",
]);

/** Singular/plural normalisation for English words ("tomatoes" -> "tomato"). */
function singularizeWord(word: string): string {
  if (word.length > 4 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.length > 4 && word.endsWith("oes")) return word.slice(0, -2);
  if (word.length > 4 && word.endsWith("ves")) return `${word.slice(0, -3)}f`;
  if (
    word.length > 3 &&
    word.endsWith("s") &&
    !word.endsWith("ss") &&
    !word.endsWith("us") &&
    !word.endsWith("is") &&
    !word.endsWith("as")
  ) {
    return word.slice(0, -1);
  }
  return word;
}

/** Lowercase, trim, strip punctuation and singularize each word. */
export function normalizeCropName(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(singularizeWord)
    .join(" ")
    .trim();
}

/** Multi-word catalog/alias keys, longest first, for substring matching. */
const MULTI_WORD_KEYS = Object.keys({ ...CATALOG, ...ALIASES })
  .filter((key) => key.includes(" "))
  .sort((a, b) => b.length - a.length);

/** Canonical catalog/alias key for a normalized crop string, or null. */
function lookupKey(normalized: string): string | null {
  if (!normalized) return null;
  const viaAlias = ALIASES[normalized];
  if (viaAlias && CATALOG[viaAlias]) return viaAlias;
  if (CATALOG[normalized]) return normalized;
  for (const key of MULTI_WORD_KEYS) {
    if (normalized.includes(key)) {
      const target = ALIASES[key] || key;
      if (CATALOG[target]) return target;
    }
  }
  return null;
}

/**
 * Resolve the canonical crop key ("tomato", "maize", "eggplant" ...) for a
 * farmer-entered name + variety. Returns null for unknown crops. Used both by
 * the image resolver and by the localized display-name layer so both stay in
 * sync on the same canonical key.
 */
export function resolveCropKey(name = "", variety = ""): string | null {
  const parts = [name, variety].map((p) => normalizeCropName(p)).filter(Boolean);
  const haystack = parts.join(" ").replace(/\s+/g, " ").trim();
  if (!haystack) return null;

  const direct = lookupKey(haystack);
  if (direct) return direct;

  // Token match: "Hybrid Tomato" -> tomato, "Desi Mango" -> mango.
  // Later occurrences win so "Cherry Tomato" resolves to tomato, not cherry.
  let best: string | null = null;
  for (const token of haystack.split(" ")) {
    if (token.length < 2 || STOP_WORDS.has(token)) continue;
    const hit = lookupKey(token);
    if (hit) best = hit;
  }
  return best;
}

/**
 * Resolve the image for a crop.
 *
 * Priority:
 *   1. A farmer-uploaded custom image (data: URL) — always wins.
 *   2. Catalog match on the normalized name + variety.
 *   3. CROP_IMAGE_UNAVAILABLE — an honest placeholder, never another crop's photo.
 */
export function resolveCropImage(
  name = "",
  variety = "",
  category = "",
  existingImage?: string,
): string {
  if (typeof existingImage === "string" && existingImage.startsWith("data:")) {
    return existingImage;
  }
  const key = resolveCropKey(name, variety);
  return key && CATALOG[key] ? CATALOG[key] : CROP_IMAGE_UNAVAILABLE;
}

/** True when the stored image is a farmer upload rather than a catalog URL. */
export function isCustomCropImage(value?: string): boolean {
  return typeof value === "string" && value.startsWith("data:");
}

/**
 * Read an image file, downscale it client-side and return a compact JPEG
 * data URL (safe to persist and well under the backend's 10 MB JSON limit).
 */
export function fileToResizedDataUrl(
  file: File,
  maxDimension = 1000,
  quality = 0.82,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the image file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file is not a readable image"));
      img.onload = () => {
        try {
          const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(String(reader.result));
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch {
          // Canvas unavailable — fall back to the raw data URL.
          resolve(String(reader.result));
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

// ---------------------------------------------------------------------------
// Public site URL / passport / QR helpers (unchanged behaviour).
// ---------------------------------------------------------------------------

const FALLBACK_SITE_URL = "https://harvest-id-passport.vercel.app";

export function getPublicSiteUrl(path = "") {
  const configured =
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    (import.meta.env["VITE_PUBLIC_SITE_URL"] || import.meta.env["VITE_APP_URL"] || "")
      ? (import.meta.env["VITE_PUBLIC_SITE_URL"] || import.meta.env["VITE_APP_URL"] || "").trim().replace(/\/$/, "")
      : "";

  const browserOrigin =
    typeof window !== "undefined" && window.location?.origin ? window.location.origin : "";
  const origin = configured || browserOrigin || FALLBACK_SITE_URL;
  const normalized = origin.replace(/\/$/, "");
  return `${normalized}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildPassportUrl(cropId: string) {
  const normalizedId = String(cropId || "").trim();
  if (!normalizedId) return getPublicSiteUrl();
  return getPublicSiteUrl(`/passport/${encodeURIComponent(normalizedId)}`);
}

export function parseCropIdFromQr(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const candidates = [trimmed];
  try {
    const url = new URL(trimmed);
    candidates.push(url.pathname.split("/").filter(Boolean).pop() || "");
  } catch {
    // ignore
  }

  for (const candidate of candidates) {
    if (!candidate) continue;
    const match = candidate.match(/(?:^|\/)([A-Za-z0-9._-]+)$/);
    if (match?.[1]) return decodeURIComponent(match[1]);
  }

  return null;
}
