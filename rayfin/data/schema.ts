import { Animals } from './Animals.js';
import { Captures } from './Captures.js';
import { CollarDeployments } from './CollarDeployments.js';
import { CollarModel } from './CollarModel.js';
import { Personnel } from './Personnel.js';
import { Species } from './Species.js';
import { StudyAreas } from './StudyAreas.js';
import { TelemetryFixes } from './TelemetryFixes.js';

export type AppSchema = {
  CollarModel: CollarModel;
  Personnel: Personnel;
  Species: Species;
  StudyAreas: StudyAreas;
  Animals: Animals;
  CollarDeployments: CollarDeployments;
  Captures: Captures;
  TelemetryFixes: TelemetryFixes;
};

export const schema = [CollarModel, Personnel, Species, StudyAreas, Animals, CollarDeployments, Captures, TelemetryFixes];
