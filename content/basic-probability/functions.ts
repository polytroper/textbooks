// =============================================================================
// Introduction to Probability
// (c) Mathigon
// =============================================================================


import {wait} from '@mathigon/core';
import {CoordinateSystem, Step} from '../shared/types';
import {CoinFlip} from './components/coin';

import './components/coin';


export function simulation($step: Step) {
  const $coordinateSystem = $step.$('x-coordinate-system') as CoordinateSystem;
  const $coin = $step.$('x-coin-flip') as CoinFlip;

  $step.model.numberOfFlips = 0;
  $step.model.numberOfHeads = 0;
  const points: number[] = [];

  $step.model.flip = async (n = 1) => {
    $step.score('flip');
    $coin.flip();
    for (let i = 0; i < n; ++i) {
      $step.model.numberOfFlips += 1;
      $step.model.numberOfHeads += (Math.random() < 0.5) ? 1 : 0;
      points.push($step.model.numberOfHeads / $step.model.numberOfFlips);
      $coordinateSystem.setPoints(points);
      await wait(10);
    }
  };
}
