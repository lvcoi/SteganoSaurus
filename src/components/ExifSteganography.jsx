import { createSignal, createEffect, onCleanup, onMount } from 'solid-js';
import { Download, MapPin, Plus, Trash2, Upload, Camera, Globe, Save, Eraser, Eye, EyeOff, ImageIcon, Link } from 'lucide-solid';
import * as piexif from 'piexifjs';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { logger } from '../utils/logger.js';

const EXIF_LIB = piexif.default || piexif;

const PRESETS = [
  {
    name: 'iPhone 15 Pro',
    fields: {
      make: 'Apple',
      model: 'iPhone 15 Pro',
      software: '17.2.1',
      lensModel: 'iPhone 15 Pro back triple camera 6.86mm f/1.78',
    },
    pairs: [
      { key: 'FocalLength', value: '6.9 mm (35mm equivalent: 24mm)' },
      { key: 'ExposureTime', value: '1/120' },
      { key: 'Aperture', value: 'f/1.8' },
      { key: 'ISO', value: '80' },
    ],
    gps: { lat: 34.0522, lon: -118.2437 },
  },
  {
    name: 'Galaxy S24 Ultra',
    fields: {
      make: 'samsung',
      model: 'SM-S928U',
      software: 'S928USQU1AXB7',
    },
    pairs: [
      { key: 'Application', value: 'Samsung Camera v14.0.00.81' },
      { key: 'FocalLength', value: '6.3 mm (35mm equivalent: 23mm)' },
      { key: 'Flash', value: 'Flash did not fire, compulsory flash mode' },
      { key: 'ColorSpace', value: 'sRGB' },
      { key: 'ImageWidth', value: '4000 px' },
    ],
  },
  {
    name: 'Pixel 8 Pro',
    fields: {
      make: 'Google',
      model: 'Pixel 8 Pro',
      software: 'Android 14',
    },
    pairs: [
      { key: 'Aperture', value: 'f/1.7' },
      { key: 'ISO', value: '18' },
      { key: 'FocalLength', value: '6.9 mm (35mm equivalent: 25mm)' },
      { key: 'WhiteBalance', value: 'Auto' },
      { key: 'MeteringMode', value: 'Center-weighted average' },
    ],
  },
  {
    name: 'Canon EOS R5',
    fields: {
      make: 'Canon',
      model: 'Canon EOS R5',
    },
    pairs: [
      { key: 'Lens', value: 'RF24-70mm F2.8 L IS USM' },
      { key: 'BodySerialNo', value: '052021001423' },
      { key: 'ExposureProgram', value: 'Aperture-priority AE' },
      { key: 'ShutterSpeed', value: '1/500' },
    ],
  },
  {
    name: 'Sony A7R V',
    fields: {
      make: 'Sony',
      model: 'ILCE-7RM5',
    },
    pairs: [
      { key: 'Lens', value: 'FE 85mm F1.4 GM' },
      { key: 'ISO', value: '12800' },
      { key: 'ShutterSpeed', value: '1/2000' },
    ],
  },
  {
    name: 'Nikon Z 9',
    fields: {
      make: 'NIKON CORPORATION',
      model: 'NIKON Z 9',
    },
    pairs: [
      { key: 'Lens', value: 'NIKKOR Z 70-200mm f/2.8 VR S' },
      { key: 'FocusMode', value: 'AF-C (Continuous)' },
      { key: 'WhiteBalance', value: '5200K' },
    ],
  },
  {
    name: 'Fujifilm X100V',
    fields: {
      make: 'FUJIFILM',
      model: 'X100V',
    },
    pairs: [
      { key: 'FilmMode', value: 'Classic Neg.' },
      { key: 'DynamicRange', value: 'DR400 (400%)' },
    ],
  },
  {
    name: 'Leica M11',
    fields: {
      make: 'Leica Camera AG',
      model: 'Leica M11',
    },
    pairs: [
      { key: 'Lens', value: 'Summilux-M 35mm f/1.4 ASPH.' },
      { key: 'ExposureMode', value: 'Manual' },
    ],
  },
  {
    name: 'GoPro HERO12 Black',
    fields: {
      make: 'GoPro',
      model: 'HERO12 Black',
    },
    pairs: [
      { key: 'FieldOfView', value: 'HyperView' },
      { key: 'ISOLimit', value: '800' },
      { key: 'Sharpness', value: 'Medium' },
      { key: 'GPSSpeed', value: '15.4 km/h' },
    ],
  },
  {
    name: 'DJI Mavic 3 Pro',
    fields: {
      make: 'DJI',
      model: 'Mavic 3 Pro',
    },
    pairs: [
      { key: 'RelativeAltitude', value: '119.8 meters' },
      { key: 'GimbalPitch', value: '-90.0' },
      { key: 'FlightSpeed', value: '5.2 m/s' },
      { key: 'CompassHeading', value: '182.4°' },
    ],
  },
  {
    name: 'Hasselblad X2D 100C',
    fields: {
      make: 'Hasselblad',
      model: 'X2D 100C',
    },
    pairs: [
      { key: 'ImageWidth', value: '11656 px' },
      { key: 'ColorProfile', value: 'Hasselblad Natural Colour Solution (HNCS)' },
    ],
  },
  {
    name: 'Insta360 X3',
    fields: {
      make: 'Insta360',
      model: 'X3',
    },
    pairs: [
      { key: 'ProjectionType', value: 'Equirectangular' },
      { key: 'StitchingSoftware', value: 'Insta360 Studio 2024' },
      { key: 'LensType', value: 'Dual Fisheye' },
    ],
  },
  {
    name: 'Xiaomi 14 Ultra',
    fields: {
      make: 'Xiaomi',
      model: 'Xiaomi 14 Ultra',
    },
    pairs: [
      { key: 'LeicaMode', value: 'Leica Authentic' },
      { key: 'Lens', value: '23mm f/1.63 - f/4.0 (Variable Aperture)' },
      { key: 'SceneType', value: 'Night Scene' },
    ],
  },
  {
    name: 'OnePlus 12',
    fields: {
      make: 'OnePlus',
      model: 'OnePlus 12',
    },
    pairs: [
      { key: 'Lens', value: '70mm f/2.6' },
      { key: 'ColorSpace', value: 'P3 (Wide Color Gamut)' },
      { key: 'Flash', value: 'Off' },
    ],
  },
  {
    name: 'Sony Xperia 1 V',
    fields: {
      make: 'Sony',
      model: 'Xperia 1 V',
    },
    pairs: [
      { key: 'DriveMode', value: 'Single Shooting' },
      { key: 'FocusArea', value: 'Eye AF (Human)' },
      { key: 'SensingMethod', value: 'One-chip color area sensor' },
    ],
  },
  {
    name: 'Canon PowerShot G7 X Mark III',
    fields: {
      make: 'Canon',
      model: 'PowerShot G7 X Mark III',
    },
    pairs: [
      { key: 'Flash', value: 'Auto, Fired, Red-eye reduction' },
      { key: 'Compression', value: 'Fine' },
    ],
  },
  {
    name: 'Fujifilm FinePix S3000',
    fields: {
      make: 'FUJIFILM',
      model: 'FinePix S3000',
    },
    pairs: [
      { key: 'Date', value: '2004:06:12 14:22:01' },
      { key: 'ISO', value: '100' },
      { key: 'Resolution', value: '2048 x 1536 (3.1 MP)' },
    ],
  },
  {
    name: 'Microsoft Surface Pro 9',
    fields: {
      make: 'Microsoft',
      model: 'Surface Pro 9',
    },
    pairs: [
      { key: 'Camera', value: 'Front-facing camera' },
      { key: 'Contrast', value: 'Normal' },
      { key: 'Saturation', value: 'Normal' },
    ],
  },
  {
    name: 'Ricoh GR IIIx',
    fields: {
      make: 'RICOH IMAGING COMPANY, LTD.',
      model: 'RICOH GR IIIx',
    },
    pairs: [
      { key: 'Focus', value: 'Snap Focus (2.5m)' },
      { key: 'Metering', value: 'Multi-segment' },
    ],
  },
];

const SAMPLE_METADATA = {
  make: 'Hasselblad',
  model: 'X2D 100C',
  software: 'Phocus 3.0',
  lensModel: 'XCD 55V',
  imageDescription: 'Harbor skyline at sunrise',
  artist: 'SteganoSaurus Demo',
  copyright: '2025 SteganoSaurus',
  pairs: [
    { key: 'Project', value: 'Coastline Survey' },
    { key: 'Access', value: 'Confidential' },
  ],
  gps: { lat: 37.7749, lon: -122.4194 },
};

const formatExifDate = (date) => {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}:${pad(date.getMonth() + 1)}:${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const EXTRA_TAGS = [
  { key: 'ExposureTime', source: 'Exif', tag: EXIF_LIB.ExifIFD.ExposureTime },
  { key: 'Aperture', source: 'Exif', tag: EXIF_LIB.ExifIFD.FNumber },
  { key: 'ISO', source: 'Exif', tag: EXIF_LIB.ExifIFD.ISOSpeedRatings },
  { key: 'FocalLength', source: 'Exif', tag: EXIF_LIB.ExifIFD.FocalLength },
  { key: 'WhiteBalance', source: 'Exif', tag: EXIF_LIB.ExifIFD.WhiteBalance },
  { key: 'MeteringMode', source: 'Exif', tag: EXIF_LIB.ExifIFD.MeteringMode },
  { key: 'Flash', source: 'Exif', tag: EXIF_LIB.ExifIFD.Flash },
  { key: 'ColorSpace', source: 'Exif', tag: EXIF_LIB.ExifIFD.ColorSpace },
  { key: 'ImageWidth', source: 'Exif', tag: EXIF_LIB.ExifIFD.PixelXDimension },
  { key: 'ImageHeight', source: 'Exif', tag: EXIF_LIB.ExifIFD.PixelYDimension },
];

const toDms = (value) => {
  const abs = Math.abs(value);
  const degrees = Math.floor(abs);
  const minutesFloat = (abs - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = (minutesFloat - minutes) * 60;
  return [
    [degrees, 1],
    [minutes, 1],
    [Math.round(seconds * 100), 100],
  ];
};

const rationalToFloat = (pair) => (pair && pair[1] ? pair[0] / pair[1] : 0);

const dmsToDecimal = (dms, ref) => {
  if (!Array.isArray(dms) || dms.length < 3) return '';
  const degrees = rationalToFloat(dms[0]);
  const minutes = rationalToFloat(dms[1]);
  const seconds = rationalToFloat(dms[2]);
  let value = degrees + minutes / 60 + seconds / 3600;
  if (ref === 'S' || ref === 'W') value *= -1;
  return value.toFixed(6);
};

const formatExifValue = (value) => {
  if (Array.isArray(value) && value.length === 2 && typeof value[0] === 'number') {
    const [num, den] = value;
    if (!den) return String(num);
    return `${num}/${den}`;
  }
  if (Array.isArray(value)) {
    return value.map((item) => formatExifValue(item)).join(', ');
  }
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value;
  if (value == null) return '';
  return String(value);
};

const extractExtraPairs = (exifData, existingPairs) => {
  const extras = [];
  const existing = new Set(existingPairs.map((pair) => pair.key));
  EXTRA_TAGS.forEach(({ key, source, tag }) => {
    const bucket = exifData?.[source] || {};
    const value = bucket?.[tag];
    if (value === undefined || value === null || value === '') return;
    if (existing.has(key)) return;
    extras.push({ key, value: formatExifValue(value) });
  });
  return extras;
};

const ensureJpegDataUrl = (dataUrl) => new Promise((resolve, reject) => {
  if (dataUrl.startsWith('data:image/jpeg')) {
    resolve(dataUrl);
    return;
  }
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas context unavailable'));
      return;
    }
    ctx.drawImage(image, 0, 0);
    resolve(canvas.toDataURL('image/jpeg', 0.92));
  };
  image.onerror = () => reject(new Error('Failed to load image'));
  image.src = dataUrl;
});

const parseCustomPairs = (userComment) => {
  if (!userComment) return [];
  try {
    const parsed = JSON.parse(userComment);
    if (Array.isArray(parsed)) {
      return parsed.map((pair) => ({
        key: String(pair.key || ''),
        value: String(pair.value || ''),
      }));
    }
    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed).map(([key, value]) => ({
        key: String(key),
        value: String(value ?? ''),
      }));
    }
  } catch (_) {
    return [{ key: 'comment', value: String(userComment) }];
  }
  return [];
};

function ExifSteganography() {
  const [imageDataUrl, setImageDataUrl] = createSignal('');
  const [imageName, setImageName] = createSignal('');
  const [previewUrl, setPreviewUrl] = createSignal('');
  const [urlInput, setUrlInput] = createSignal('');
  const [urlStatus, setUrlStatus] = createSignal('');
  const [urlError, setUrlError] = createSignal('');
  const [isDragging, setIsDragging] = createSignal(false);
  const [isProcessing, setIsProcessing] = createSignal(false);

  const [make, setMake] = createSignal('');
  const [model, setModel] = createSignal('');
  const [software, setSoftware] = createSignal('');
  const [lensModel, setLensModel] = createSignal('');
  const [dateTimeOriginal, setDateTimeOriginal] = createSignal('');
  const [imageDescription, setImageDescription] = createSignal('');
  const [artist, setArtist] = createSignal('');
  const [copyright, setCopyright] = createSignal('');

  const [customPairs, setCustomPairs] = createSignal([]);
  const [gpsLat, setGpsLat] = createSignal('');
  const [gpsLon, setGpsLon] = createSignal('');
  const [mapOpen, setMapOpen] = createSignal(false);
  const [presetName, setPresetName] = createSignal('');
  const [exifOpen, setExifOpen] = createSignal(false);
  const [rawExifObject, setRawExifObject] = createSignal(null);

  let fileInputRef;
  let mapContainerRef;
  let mapInstance;
  let gpsMarker;

  onMount(() => {
    logger.info('[ExifSteganography] mounted');
  });

  createEffect(() => {
    if (!mapOpen() || !mapContainerRef) return;

    mapInstance = L.map(mapContainerRef, { zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapInstance);

    const lat = parseFloat(gpsLat());
    const lon = parseFloat(gpsLon());
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);
    const center = hasCoords ? [lat, lon] : [0, 0];
    mapInstance.setView(center, hasCoords ? 12 : 2);

    if (hasCoords) {
      gpsMarker = L.circleMarker(center, { radius: 8, color: '#2563eb' }).addTo(mapInstance);
    }

    mapInstance.on('click', (event) => {
      const nextLat = event.latlng.lat.toFixed(6);
      const nextLon = event.latlng.lng.toFixed(6);
      setGpsLat(nextLat);
      setGpsLon(nextLon);
      if (gpsMarker) {
        gpsMarker.setLatLng(event.latlng);
      } else {
        gpsMarker = L.circleMarker(event.latlng, { radius: 8, color: '#2563eb' }).addTo(mapInstance);
      }
    });

    setTimeout(() => mapInstance.invalidateSize(), 0);

    onCleanup(() => {
      if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
        gpsMarker = null;
      }
    });
  });

  const populateFromExif = (exifData) => {
    const nextMake = exifData?.['0th']?.[EXIF_LIB.ImageIFD.Make] || '';
    const nextModel = exifData?.['0th']?.[EXIF_LIB.ImageIFD.Model] || '';
    const nextSoftware = exifData?.['0th']?.[EXIF_LIB.ImageIFD.Software] || '';
    const nextDescription = exifData?.['0th']?.[EXIF_LIB.ImageIFD.ImageDescription] || '';
    const nextArtist = exifData?.['0th']?.[EXIF_LIB.ImageIFD.Artist] || '';
    const nextCopyright = exifData?.['0th']?.[EXIF_LIB.ImageIFD.Copyright] || '';
    const nextLensModel = exifData?.Exif?.[EXIF_LIB.ExifIFD.LensModel] || '';
    const nextDate = exifData?.Exif?.[EXIF_LIB.ExifIFD.DateTimeOriginal] || '';

    setMake(nextMake);
    setModel(nextModel);
    setSoftware(nextSoftware);
    setImageDescription(nextDescription);
    setArtist(nextArtist);
    setCopyright(nextCopyright);
    setLensModel(nextLensModel);
    setDateTimeOriginal(nextDate);

    const userComment = exifData?.Exif?.[EXIF_LIB.ExifIFD.UserComment];
    const parsedPairs = parseCustomPairs(userComment);
    const extraPairs = extractExtraPairs(exifData, parsedPairs);
    setCustomPairs([...parsedPairs, ...extraPairs]);

    const lat = dmsToDecimal(exifData?.GPS?.[EXIF_LIB.GPSIFD.GPSLatitude], exifData?.GPS?.[EXIF_LIB.GPSIFD.GPSLatitudeRef]);
    const lon = dmsToDecimal(exifData?.GPS?.[EXIF_LIB.GPSIFD.GPSLongitude], exifData?.GPS?.[EXIF_LIB.GPSIFD.GPSLongitudeRef]);
    setGpsLat(lat);
    setGpsLon(lon);

  };

  const loadImageFromDataUrl = async (dataUrl, name = '') => {
    try {
      const jpegDataUrl = await ensureJpegDataUrl(dataUrl);
      setImageDataUrl(jpegDataUrl);
      setPreviewUrl(jpegDataUrl);
      setImageName(name);

      let exifData = null;
      try {
        exifData = EXIF_LIB.load(jpegDataUrl);
      } catch (err) {
        logger.warn('[ExifSteganography] no EXIF data found', err);
      }

      if (exifData) {
        setRawExifObject(exifData);
        populateFromExif(exifData);
      } else {
        setRawExifObject(null);
      }
    } catch (err) {
      logger.error('[ExifSteganography] loadImageFromDataUrl error', err);
      logger.userError('Failed to load image metadata.', { err });
    }
  };

  const handleImageUpload = async (e) => {
    try {
      const file = e.currentTarget.files?.[0];
      if (!file) {
        logger.warn('[ExifSteganography] handleImageUpload: no file selected');
        return;
      }
      logger.info('[ExifSteganography] handleImageUpload file', { name: file.name, size: file.size, type: file.type });

      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = event.target?.result;
        if (!result) return;
        await loadImageFromDataUrl(result, file.name);
      };
      reader.onerror = (err) => {
        logger.error('[ExifSteganography] FileReader error', err);
        logger.userError('Failed to read image file.', { err });
      };
      reader.readAsDataURL(file);
    } catch (err) {
      logger.error('[ExifSteganography] handleImageUpload error', err);
      logger.userError('Image upload error.', { err });
    }
  };

  const fetchImageFromUrl = async () => {
    const url = urlInput().trim();
    if (!url) return;
    setUrlStatus('Fetching image...');
    setUrlError('');
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) {
        throw new Error('URL did not return an image');
      }
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target?.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const name = url.split('/').pop() || 'remote-image';
      await loadImageFromDataUrl(dataUrl, name);
      setUrlStatus('Image loaded from URL.');
      if (fileInputRef) fileInputRef.value = '';
    } catch (err) {
      logger.error('[ExifSteganography] fetchImageFromUrl error', err);
      setUrlError('Unable to fetch this image. CORS or network restrictions may apply.');
      setUrlStatus('');
    }
  };

  const applyPreset = () => {
    const preset = PRESETS.find((item) => item.name === presetName());
    if (!preset) return;
    setMake(preset.fields.make || '');
    setModel(preset.fields.model || '');
    setSoftware(preset.fields.software || '');
    setLensModel(preset.fields.lensModel || '');
    setDateTimeOriginal(formatExifDate(new Date()));
    setImageDescription(preset.fields.imageDescription || '');
    setArtist(preset.fields.artist || '');
    setCopyright(preset.fields.copyright || '');
    setCustomPairs(preset.pairs ? preset.pairs.map((pair) => ({ ...pair })) : []);
    if (preset.gps) {
      setGpsLat(String(preset.gps.lat));
      setGpsLon(String(preset.gps.lon));
    }
  };

  const applySampleMetadata = () => {
    setPresetName('');
    setMake(SAMPLE_METADATA.make);
    setModel(SAMPLE_METADATA.model);
    setSoftware(SAMPLE_METADATA.software);
    setLensModel(SAMPLE_METADATA.lensModel);
    setDateTimeOriginal(formatExifDate(new Date()));
    setImageDescription(SAMPLE_METADATA.imageDescription);
    setArtist(SAMPLE_METADATA.artist);
    setCopyright(SAMPLE_METADATA.copyright);
    setCustomPairs(SAMPLE_METADATA.pairs.map((pair) => ({ ...pair })));
    setGpsLat(String(SAMPLE_METADATA.gps.lat));
    setGpsLon(String(SAMPLE_METADATA.gps.lon));
  };

  const buildCustomPayload = () => {
    const entries = customPairs()
      .map((pair) => ({
        key: String(pair.key || '').trim(),
        value: String(pair.value || ''),
      }))
      .filter((pair) => pair.key);

    if (!entries.length) return '';
    const payload = {};
    entries.forEach((entry) => {
      payload[entry.key] = entry.value;
    });
    return JSON.stringify(payload);
  };

  const applyMetadata = () => {
    if (!imageDataUrl()) return;

    try {
      const base = rawExifObject() ? JSON.parse(JSON.stringify(rawExifObject())) : { '0th': {}, Exif: {}, GPS: {} };
      const exifObj = {
        '0th': base['0th'] || {},
        Exif: base.Exif || {},
        GPS: base.GPS || {},
        Interop: base.Interop || {},
        '1st': base['1st'] || {},
        thumbnail: base.thumbnail || null,
      };

      if (make()) exifObj['0th'][EXIF_LIB.ImageIFD.Make] = make();
      if (model()) exifObj['0th'][EXIF_LIB.ImageIFD.Model] = model();
      if (software()) exifObj['0th'][EXIF_LIB.ImageIFD.Software] = software();
      if (imageDescription()) exifObj['0th'][EXIF_LIB.ImageIFD.ImageDescription] = imageDescription();
      if (artist()) exifObj['0th'][EXIF_LIB.ImageIFD.Artist] = artist();
      if (copyright()) exifObj['0th'][EXIF_LIB.ImageIFD.Copyright] = copyright();

      if (lensModel()) exifObj.Exif[EXIF_LIB.ExifIFD.LensModel] = lensModel();
      if (dateTimeOriginal()) {
        exifObj.Exif[EXIF_LIB.ExifIFD.DateTimeOriginal] = dateTimeOriginal();
        exifObj['0th'][EXIF_LIB.ImageIFD.DateTime] = dateTimeOriginal();
      }

      const customPayload = buildCustomPayload();
      if (customPayload) {
        exifObj.Exif[EXIF_LIB.ExifIFD.UserComment] = customPayload;
      }

      const lat = parseFloat(gpsLat());
      const lon = parseFloat(gpsLon());
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        exifObj.GPS[EXIF_LIB.GPSIFD.GPSLatitudeRef] = lat >= 0 ? 'N' : 'S';
        exifObj.GPS[EXIF_LIB.GPSIFD.GPSLatitude] = toDms(lat);
        exifObj.GPS[EXIF_LIB.GPSIFD.GPSLongitudeRef] = lon >= 0 ? 'E' : 'W';
        exifObj.GPS[EXIF_LIB.GPSIFD.GPSLongitude] = toDms(lon);
      }

      const exifBytes = EXIF_LIB.dump(exifObj);
      const updatedUrl = EXIF_LIB.insert(exifBytes, imageDataUrl());
      setPreviewUrl(updatedUrl);
      logger.info('[ExifSteganography] metadata applied');
    } catch (err) {
      logger.error('[ExifSteganography] applyMetadata error', err);
      logger.userError('Failed to apply metadata.', { err });
    }
  };

  const eraseMetadata = () => {
    if (!imageDataUrl()) return;
    setMake('');
    setModel('');
    setSoftware('');
    setLensModel('');
    setDateTimeOriginal('');
    setImageDescription('');
    setArtist('');
    setCopyright('');
    setCustomPairs([]);
    setGpsLat('');
    setGpsLon('');
    setRawExifObject(null);

    try {
      const exifBytes = EXIF_LIB.dump({ '0th': {}, Exif: {}, GPS: {} });
      const updatedUrl = EXIF_LIB.insert(exifBytes, imageDataUrl());
      setPreviewUrl(updatedUrl);
      logger.info('[ExifSteganography] metadata erased');
    } catch (err) {
      logger.error('[ExifSteganography] eraseMetadata error', err);
      logger.userError('Failed to erase metadata.', { err });
    }
  };

  const addPair = () => {
    setCustomPairs((pairs) => [...pairs, { key: '', value: '' }]);
  };

  const updatePair = (index, field, value) => {
    setCustomPairs((pairs) =>
      pairs.map((pair, idx) => (idx === index ? { ...pair, [field]: value } : pair))
    );
  };

  const removePair = (index) => {
    setCustomPairs((pairs) => pairs.filter((_, idx) => idx !== index));
  };

  const downloadImage = () => {
    if (!previewUrl()) return;
    const link = document.createElement('a');
    link.download = imageName() ? imageName().replace(/\.jpe?g$/i, '') + '-exif.jpg' : 'exif-image.jpg';
    link.href = previewUrl();
    link.click();
  };

  const clearPreview = () => {
    setImageDataUrl('');
    setPreviewUrl('');
    setImageName('');
    setUrlInput('');
    setUrlStatus('');
    setUrlError('');
    setExifOpen(false);
    setRawExifObject(null);
    setCustomPairs([]);
    setMake('');
    setModel('');
    setSoftware('');
    setLensModel('');
    setDateTimeOriginal('');
    setImageDescription('');
    setArtist('');
    setCopyright('');
    setGpsLat('');
    setGpsLon('');
    if (fileInputRef) fileInputRef.value = '';
  };

  return (
    <div class="space-y-6">
      {/* Upload Section with Drag & Drop */}
      <div>
        <label class="mb-2 block text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Camera class="h-4 w-4 text-slate-400" />
          Upload JPEG/JPG
        </label>
        <div
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer?.files?.[0];
            if (file && (file.type === 'image/jpeg' || file.type === 'image/jpg')) {
              const reader = new FileReader();
              reader.onload = async (event) => {
                const result = event.target?.result;
                if (result) await loadImageFromDataUrl(result, file.name);
              };
              reader.readAsDataURL(file);
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          class={`relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-8 transition-all duration-300 cursor-pointer ${
            isDragging()
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
          }`}
          onClick={() => fileInputRef?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg"
            onChange={handleImageUpload}
            class="hidden"
          />
          <div class={`flex h-14 w-14 items-center justify-center rounded-xl transition-all duration-300 ${
            isDragging() ? 'bg-blue-500 text-white scale-110' : 'bg-slate-100 text-slate-400'
          }`}>
            <Upload class="h-7 w-7" />
          </div>
          <div class="text-center">
            <p class="font-semibold text-slate-700">
              {isDragging() ? 'Drop JPEG here' : 'Click to upload or drag and drop'}
            </p>
            <p class="mt-1 text-sm text-slate-500">JPEG/JPG files only</p>
          </div>
        </div>
        {imageName() && (
          <div class="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2">
            <ImageIcon class="h-4 w-4 text-blue-600" />
            <span class="truncate text-sm font-medium text-blue-700">{imageName()}</span>
          </div>
        )}
      </div>

      {/* URL Input */}
      <div>
        <label class="mb-2 block text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Link class="h-4 w-4 text-slate-400" />
          Or load from URL (downloads + converts to JPEG)
        </label>
        <div class="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={urlInput()}
            onInput={(e) => setUrlInput(e.currentTarget.value)}
            placeholder="https://example.com/photo.png"
            class="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition-all duration-300 hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 flex-1 min-w-[240px]"
          />
          <button
            onClick={fetchImageFromUrl}
            disabled={!urlInput() || isProcessing()}
            class="relative overflow-hidden rounded-xl border-2 border-blue-500 bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-blue-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
            data-tooltip="Download and convert image from URL"
          >
            {isProcessing() ? (
              <>
                <div class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Fetching...
              </>
            ) : (
              <>
                <Globe class="h-4 w-4" />
                Fetch Image
              </>
            )}
          </button>
        </div>
        {urlStatus() && (
          <p class="text-sm text-emerald-600 mt-2 font-medium">✓ {urlStatus()}</p>
        )}
        {urlError() && (
          <p class="text-sm text-red-600 mt-2 font-medium">⚠️ {urlError()}</p>
        )}
      </div>

      {/* EXIF Editor Section */}
      <div class="rounded-2xl border-2 border-slate-200 p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div class="flex flex-wrap items-center gap-4 justify-between">
          <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Camera class="h-5 w-5 text-blue-500" />
            EXIF Editor
          </h3>
          <div class="flex flex-wrap items-center gap-3">
            <select
              value={presetName()}
              onChange={(e) => setPresetName(e.currentTarget.value)}
              class="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all duration-300 hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 pr-10"
              data-tooltip="Select a camera preset to auto-fill metadata"
            >
              <option value="">Choose a preset camera</option>
              {PRESETS.map((preset) => (
                <option value={preset.name}>{preset.name}</option>
              ))}
            </select>
            <button
              onClick={applyPreset}
              disabled={!presetName()}
              class="relative rounded-xl border-2 border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              data-tooltip="Apply the selected camera preset"
            >
              Apply Preset
            </button>
            <button
              onClick={applySampleMetadata}
              class="relative rounded-xl border-2 border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              data-tooltip="Fill in sample metadata values"
            >
              Fill Sample
            </button>
            <button
              onClick={() => setExifOpen((open) => !open)}
              disabled={!imageDataUrl()}
              class="relative overflow-hidden rounded-xl border-2 border-blue-500 bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-blue-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
              data-tooltip={exifOpen() ? 'Hide custom metadata fields' : 'Show custom metadata fields'}
            >
              {exifOpen() ? <EyeOff class="h-4 w-4" /> : <Eye class="h-4 w-4" />}
              {exifOpen() ? 'Hide Custom' : 'Custom Fields'}
            </button>
          </div>
        </div>

        {/* Standard EXIF Fields */}
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700">Make</label>
            <input
              type="text"
              value={make()}
              onInput={(e) => setMake(e.currentTarget.value)}
              placeholder="e.g., Apple, Canon, Sony"
              class="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition-all duration-300 hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700">Model</label>
            <input
              type="text"
              value={model()}
              onInput={(e) => setModel(e.currentTarget.value)}
              placeholder="e.g., iPhone 15 Pro, EOS R5"
              class="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition-all duration-300 hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700">Software</label>
            <input
              type="text"
              value={software()}
              onInput={(e) => setSoftware(e.currentTarget.value)}
              placeholder="e.g., iOS 17.2, Lightroom"
              class="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition-all duration-300 hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700">Lens Model</label>
            <input
              type="text"
              value={lensModel()}
              onInput={(e) => setLensModel(e.currentTarget.value)}
              placeholder="e.g., RF 24-70mm F2.8"
              class="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition-all duration-300 hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700">Date/Time Original</label>
            <input
              type="text"
              value={dateTimeOriginal()}
              onInput={(e) => setDateTimeOriginal(e.currentTarget.value)}
              placeholder="YYYY:MM:DD HH:MM:SS"
              class="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition-all duration-300 hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700">Image Description</label>
            <input
              type="text"
              value={imageDescription()}
              onInput={(e) => setImageDescription(e.currentTarget.value)}
              placeholder="Description of the image"
              class="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition-all duration-300 hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700">Artist</label>
            <input
              type="text"
              value={artist()}
              onInput={(e) => setArtist(e.currentTarget.value)}
              placeholder="Photographer name"
              class="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition-all duration-300 hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700">Copyright</label>
            <input
              type="text"
              value={copyright()}
              onInput={(e) => setCopyright(e.currentTarget.value)}
              placeholder="© 2025 Your Name"
              class="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition-all duration-300 hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        </div>

        {/* Custom Key/Value Pairs */}
        {exifOpen() && (
          <div class="space-y-4 rounded-xl border-2 border-slate-200 bg-white p-4">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-bold text-slate-900">Custom Key/Value Metadata</h4>
              <button
                onClick={addPair}
                class="relative rounded-xl border-2 border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 py-2 px-4 flex items-center gap-2"
                data-tooltip="Add a new custom metadata field"
              >
                <Plus class="h-4 w-4" />
                Add Field
              </button>
            </div>
            {customPairs().length === 0 && (
              <p class="text-sm text-slate-500 py-4 text-center bg-slate-50 rounded-lg">
                Add key/value metadata to store in UserComment. Click "Add Field" to get started.
              </p>
            )}
            {customPairs().map((pair, index) => (
              <div class="grid gap-3 md:grid-cols-[1fr_1fr_auto] items-center">
                <input
                  type="text"
                  value={pair.key}
                  onInput={(e) => updatePair(index, 'key', e.currentTarget.value)}
                  placeholder="Key (e.g., Project)"
                  class="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition-all duration-300 hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                />
                <input
                  type="text"
                  value={pair.value}
                  onInput={(e) => updatePair(index, 'value', e.currentTarget.value)}
                  placeholder="Value"
                  class="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition-all duration-300 hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                />
                <button
                  onClick={() => removePair(index)}
                  class="p-2.5 rounded-lg text-slate-400 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
                  aria-label="Remove field"
                  data-tooltip="Remove this field"
                >
                  <Trash2 class="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* GPS Coordinates */}
        <div class="space-y-4 rounded-xl border-2 border-slate-200 bg-white p-4">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin class="h-4 w-4 text-blue-500" />
              GPS Coordinates
            </h4>
            <button
              onClick={() => setMapOpen(true)}
              class="relative rounded-xl border-2 border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 py-2 px-4 flex items-center gap-2"
              data-tooltip="Open map to select location"
            >
              <MapPin class="h-4 w-4" />
              Pick on Map
            </button>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <input
              type="text"
              value={gpsLat()}
              onInput={(e) => setGpsLat(e.currentTarget.value)}
              placeholder="Latitude (e.g., 37.7749)"
              class="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition-all duration-300 hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
            />
            <input
              type="text"
              value={gpsLon()}
              onInput={(e) => setGpsLon(e.currentTarget.value)}
              placeholder="Longitude (e.g., -122.4194)"
              class="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition-all duration-300 hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
          {gpsLat() && gpsLon() && (
            <p class="text-xs text-slate-500">
              📍 Location: {gpsLat()}, {gpsLon()}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div class="flex flex-wrap gap-3">
          <button
            onClick={applyMetadata}
            disabled={!imageDataUrl()}
            class="relative overflow-hidden rounded-xl border-2 border-blue-500 bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-blue-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
            data-tooltip="Apply all metadata changes to the image"
          >
            <Save class="h-4 w-4" />
            Save Metadata
          </button>
          <button
            onClick={eraseMetadata}
            disabled={!imageDataUrl()}
            class="relative rounded-xl border-2 border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
            data-tooltip="Remove all EXIF data from the image"
          >
            <Eraser class="h-4 w-4" />
            Erase All Metadata
          </button>
        </div>
      </div>

      {/* Image Preview */}
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon class="h-5 w-5 text-slate-400" />
            Image Preview
          </h3>
          <div class="flex items-center gap-3">
            {previewUrl() && (
              <button
                onClick={clearPreview}
                class="text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
              >
                Clear
              </button>
            )}
            <button
              onClick={downloadImage}
              disabled={!previewUrl()}
              class="relative overflow-hidden rounded-xl border-2 border-blue-500 bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-blue-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
              data-tooltip="Download image with modified EXIF data"
            >
              <Download class="h-4 w-4" />
              Download JPEG
            </button>
          </div>
        </div>
        <div class="rounded-xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 flex items-center justify-center min-h-56 relative shadow-inner">
          {previewUrl() && (
            <button
              onClick={clearPreview}
              class="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/90 border-2 border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-all duration-200 flex items-center justify-center"
              aria-label="Clear preview"
              data-tooltip="Clear preview"
            >
              ×
            </button>
          )}
          {previewUrl() ? (
            <img src={previewUrl()} alt="Preview" class="max-w-full max-h-56 h-auto object-contain rounded-lg shadow-md" />
          ) : (
            <div class="text-center py-8">
              <ImageIcon class="mx-auto h-12 w-12 text-slate-300" />
              <p class="mt-3 text-sm font-medium text-slate-500">Upload a JPEG or provide a URL to start editing metadata</p>
            </div>
          )}
        </div>
      </div>

      {/* Map Modal */}
      {mapOpen() && (
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="rounded-2xl bg-white shadow-2xl w-full max-w-3xl overflow-hidden border-2 border-slate-200">
            <div class="flex items-center justify-between px-6 py-4 border-b-2 border-slate-100">
              <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MapPin class="h-5 w-5 text-blue-500" />
                Select GPS Location
              </h3>
              <button
                onClick={() => setMapOpen(false)}
                class="relative rounded-xl border-2 border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 py-2 px-4"
              >
                Close
              </button>
            </div>
            <div class="p-6">
              <div ref={mapContainerRef} class="h-80 w-full rounded-xl border-2 border-slate-200 shadow-inner" />
              <p class="text-xs text-slate-500 mt-4">
                💡 Click anywhere on the map to set GPS coordinates. The values will update immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div class="rounded-xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 transition-all duration-300 hover:border-blue-200 hover:shadow-md">
        <div class="flex items-start gap-3">
          <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
            <span class="text-sm">💡</span>
          </div>
          <div>
            <p class="mb-1 text-sm font-bold text-slate-900">How it works</p>
            <p class="text-sm leading-relaxed text-slate-600">
              EXIF metadata is written into the JPEG file, including optional GPS coordinates and custom key/value data stored in UserComment.
              You can edit camera information, add location data, or hide custom information in the metadata fields.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExifSteganography;
