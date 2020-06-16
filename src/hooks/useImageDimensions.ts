/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useState } from "react";
import { Image, ImageURISource, Dimensions as RDimensions } from "react-native";

import { createCache } from "../utils";
import { Dimensions, ImageSource } from "../@types";

const CACHE_SIZE = 50;
const imageDimensionsCache = createCache(CACHE_SIZE);
const { width: screenWidth, height: screenHeight } = RDimensions.get("screen");

const useImageDimensions = (image: ImageSource): Dimensions | null => {
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);

  const getImageDimensions = (image: ImageSource): Promise<Dimensions> => {
    return new Promise((resolve) => {
      const { width: originalW, height: originalH } = Image.resolveAssetSource(
        image
      );
      if (typeof image == "number") {
        const cacheKey = `${image}`;
        let imageDimensions = imageDimensionsCache.get(cacheKey);

        if (!imageDimensions) {
          imageDimensions = {
            width: originalW || screenWidth,
            height: originalH || screenHeight * 0.75,
          };
          imageDimensionsCache.set(cacheKey, imageDimensions);
        }

        resolve(imageDimensions);

        return;
      }

      // @ts-ignore
      if (image.uri) {
        const source = image as ImageURISource;

        const cacheKey = source.uri as string;

        const imageDimensions = imageDimensionsCache.get(cacheKey);

        if (imageDimensions) {
          resolve({
            width: originalW || screenWidth,
            height: originalH || screenHeight * 0.75,
          });
        } else {
          // @ts-ignore
          Image.getSizeWithHeaders(
            source.uri,
            source.headers,
            (width: number, height: number) => {
              imageDimensionsCache.set(cacheKey, { width, height });
              resolve({
                width: width || originalW || screenWidth,
                height: height || originalH || screenHeight * 0.75,
              });
            },
            () => {
              resolve({ width: 0, height: 0 });
            }
          );
        }
      } else {
        resolve({ width: 0, height: 0 });
      }
    });
  };

  let isImageUnmounted = false;

  useEffect(() => {
    getImageDimensions(image).then((dimensions) => {
      if (!isImageUnmounted) {
        let newDimensions =
          dimensions.height == 0 || dimensions.width == 0
            ? { height: screenHeight * 0.75, width: screenWidth }
            : dimensions;
        setDimensions(newDimensions);
      }
    });

    return () => {
      isImageUnmounted = true;
    };
  }, [image]);

  return dimensions;
};

export default useImageDimensions;
