export type Assignment = {
  name: string;
  pointsReceived: number;
  pointsPossible: number;
};

export type Category = {
  name: string;
  weight: number;
  assignments: Assignment[];
};
