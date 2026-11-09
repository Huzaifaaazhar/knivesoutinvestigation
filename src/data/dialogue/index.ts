import type { Script } from '../../systems/dialogue';
import { BLANC } from './blanc';
import { MARTA, RANSOM } from './marta-ransom';
import { JONI, LINDA, MEG, RICHARD, WALT } from './family';

export const SCRIPTS: Record<string, Script> = {
  blanc: BLANC,
  marta: MARTA,
  ransom: RANSOM,
  linda: LINDA,
  walt: WALT,
  joni: JONI,
  meg: MEG,
  richard: RICHARD,
};
