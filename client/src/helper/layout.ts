
const HORIZONTAL = '-' as const;
const VERTICAL = '|' as const;
const PHOTO_ORIENTATIONS = [HORIZONTAL, VERTICAL] as const;
export type PhotoOrientation = typeof PHOTO_ORIENTATIONS[number];
export type PhotoGroupingConfig = { [HORIZONTAL]: number, [VERTICAL]: number }


export type PhotoGroupingStrategy = <P>(config: PhotoGroupingConfig, photos: P[], getPhotoType: (p: P) => PhotoOrientation) => { items: P[], type: PhotoOrientation }[]

export const strictlyOrdered: PhotoGroupingStrategy = (config, photos, getPhotoType) => {
  type T = typeof photos[0];
  type G = { items: T[], type: '-' | '|' };
  let grouped: G[] = [];

  let currentGroup: G = { items: [], type: '-' };
  photos.forEach(p => {
    if (currentGroup.items.length >= config[currentGroup.type] || currentGroup.type !== getPhotoType(p)) {
      grouped.push(currentGroup);
      currentGroup = { items: [], type: getPhotoType(p) };
    }
    currentGroup.items.push(p);
  });
  grouped.push(currentGroup);

  grouped = grouped.filter(g => g.items.length > 0);

  return grouped;
}

/**
 * Order photos.
 * If there aren't enough to fill a group, it will be kept until it's full.
 * @param config
 * @param photos
 * @param getPhotoType
 */
export const looselyOrdered: PhotoGroupingStrategy = (config, photos, getPhotoType) => {
  type T = typeof photos[0];
  type G = { items: T[], type: '-' | '|' };
  const grouped: G[] = [];

  let verticalLeftOvers: T[] = [];
  let horizontalLeftOvers: T[] = [];

  photos.forEach(p => {
    if (getPhotoType(p) === '|') {
      if (verticalLeftOvers.length < config['|']) {
        verticalLeftOvers.push(p);
      } else {
        grouped.push({ items: verticalLeftOvers, type: '|' });
        verticalLeftOvers = [p];
      }
    } else {
      if (horizontalLeftOvers.length < config['-']) {
        horizontalLeftOvers.push(p);
      } else {
        grouped.push({ items: horizontalLeftOvers, type: '-' });
        horizontalLeftOvers = [p];
      }
    }
  });


  if (verticalLeftOvers.length === config['|']) {
    grouped.push({ items: verticalLeftOvers, type: '|' });
    verticalLeftOvers = [];
  }

  if (horizontalLeftOvers.length === config['-']) {
    grouped.push({ items: horizontalLeftOvers, type: '-' });
    horizontalLeftOvers = [];
  }

  if (verticalLeftOvers.length > 0 || horizontalLeftOvers.length > 0) {
    grouped.push({ items: [...verticalLeftOvers, ...horizontalLeftOvers], type: '|' });
  }

  return grouped;
}
