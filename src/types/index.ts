export type VinylSize = '12inch' | '10inch' | '7inch';
export type VinylRpm = '33rpm' | '45rpm';
export type VinylWeight = '140g' | '180g';
export type CenterHoleType = 'standard_small' | 'dinked_large';

export type VinylBaseMaterial = 'opaque' | 'translucent' | 'smoke' | 'picture_disc';

export type VinylFinishEffect =
  | 'none'
  | 'splatter'
  | 'two_tone'
  | 'three_tone'
  | 'color_in_color'
  | 'galaxy_swirl'
  | 'glow_in_the_dark'
  | 'liquid_glitter';

export type SplatterToneCount = 1 | 2 | 3;

export type VinylColorStyle =
  | 'standard_black'
  | 'solid'
  | 'transparent'
  | 'marble'
  | 'splatter'
  | 'color_in_color'
  | 'half_and_half'
  | 'tri_color_split'
  | 'glow_in_the_dark'
  | 'liquid_glitter'
  | 'picture_disc';

export interface TrackItem {
  id: string;
  number: string;
  title: string;
  duration: string;
}

export interface CenterLabelConfig {
  diameterMm: number;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  artworkImage: string | null;
  title: string;
  artist: string;
  sideIndicator: string;
  rpmBadge: string;
  catalogNumber: string;
  tracks: TrackItem[];
  copyrightNotice: string;
  labelLayout: 'classic_ring' | 'minimal_modern' | 'vintage_jazz' | 'techno_bold' | 'clean_split';
}

export interface VinylConfig {
  size: VinylSize;
  rpm: VinylRpm;
  weight: VinylWeight;
  holeType: CenterHoleType;

  // Decoupled Foundation & Finish
  baseMaterial: VinylBaseMaterial;
  baseColor: string;
  transparency: number; // 0 to 1

  finishEffect: VinylFinishEffect;
  secondaryColor: string;
  tertiaryColor?: string;

  // Multi-tone Splatter System (1-tone, 2-tone, 3-tone)
  splatterToneCount: SplatterToneCount;
  splatterColor1: string;
  splatterColor2: string;
  splatterColor3: string;
  splatterDensity: number; // 10 to 100
  splatterSpread: number; // 0.5 to 2.0

  // Specialty options
  pictureDiscImage: string | null;
  pictureDiscBackImage?: string | null;
  glowColor?: string;

  trackBandsCount: number; // Visual concentric audio tracks (typically 3 to 6)
  matrixTextSideA: string;
  matrixTextSideB: string;
  sideALabel: CenterLabelConfig;
  sideBLabel: CenterLabelConfig;

  // Compatibility aliases
  colorStyle?: VinylColorStyle;
  primaryColor?: string;
  splatterColor?: string;
}

export type JacketType = 'single_pocket' | 'gatefold' | 'disco_bag';
export type CardstockType = 'standard_white' | 'reverse_board_matte' | 'heavyweight_kraft' | 'metallic_silver';
export type FinishType = 'matte' | 'gloss' | 'uncoated_matte' | 'soft_touch';
export type SpecialFX = 'none' | 'gold_foil' | 'silver_foil' | 'spot_uv';

export interface JacketConfig {
  type: JacketType;
  cardstock: CardstockType;
  finish: FinishType;
  specialFX: SpecialFX;
  spineWidthMm: number; // 3mm standard, 5mm for gatefold
  frontArtwork: string | null;
  backArtwork: string | null;
  gatefoldInsideLeftArtwork: string | null;
  gatefoldInsideRightArtwork: string | null;
  spineText: string;
  artistName: string;
  albumTitle: string;
  catalogNumber: string;
  barcode: string;
  parentalAdvisory: boolean;
  centerCutoutHole: boolean; // For disco bags
  bgColor: string;
  accentColor: string;
}

export type InnerSleeveType =
  | 'anti_static_rice_paper'
  | 'poly_lined_paper'
  | 'poly_lined_black'
  | 'japanese_u_bottom'
  | 'printed_heavyweight'
  | 'heavyweight_kraft';

export interface InnerSleeveConfig {
  type: InnerSleeveType;
  frontArtwork: string | null;
  backArtwork: string | null;
  hasDieCutHole: boolean;
  dieCutDiameterMm: number; // 85 or 100
  backgroundColor: string;
  translucency: number; // 0 to 1
  archivalPrintText: string;
  cornerStyle: 'square' | 'rounded' | 'clipped';
}

export interface ObiStripConfig {
  enabled: boolean;
  widthMm: number;
  position: 'left' | 'right';
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  japaneseTitle: string;
  katakanaArtist: string;
  priceJpy: string;
  releaseCode: string;
  catchphrase: string;
  specsLine: string;
  barcodeText: string;
}

export interface ProjectData {
  id: string;
  name: string;
  updatedAt: string;
  vinyl: VinylConfig;
  jacket: JacketConfig;
  innerSleeve: InnerSleeveConfig;
  obi: ObiStripConfig;
}

export type ActiveWorkspaceView = 'studio' | 'diecut' | 'specs';

export type ActiveDiecutComponent =
  | 'jacket_front'
  | 'jacket_back'
  | 'jacket_spread'
  | 'label_a'
  | 'label_b'
  | 'inner_sleeve'
  | 'obi_strip';

export type StudioBackground =
  | 'dark_studio'
  | 'walnut_credenza'
  | 'tokyo_neon'
  | 'bauhaus_concrete'
  | 'sunset_haze'
  | 'transparent_grid';

export type StudioDisplayMode =
  | 'sleeve_and_disc'
  | 'inner_and_disc'
  | 'vinyl_solo'
  | 'jacket_solo'
  | 'turntable';
export type SlipmatStyle = 'cork' | 'felt_black' | 'geometric' | 'rubber';

export interface StudioViewState {
  activeView: ActiveWorkspaceView;
  activeComponent: ActiveDiecutComponent;
  displayMode: StudioDisplayMode;
  background: StudioBackground;
  slipmat: SlipmatStyle;
  vinylSide: 'A' | 'B';
  isSpinning: boolean;
  rpm: 33.33 | 45;
  pitch: number; // -8% to +8%
  extraction: number; // 0 to 1 (0 = in sleeve, 1 = separated)
  cameraAngle: { rotX: number; rotY: number; zoom: number };
  showLightingReflection: boolean;
  crackleAudio: boolean;
}
