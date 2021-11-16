export type InstanceParams = {
  [key: string]: string;
};

export type Instance = {
  id: string;
  path: string;
  status: string;
  workflow: string;
  params: InstanceParams;
};
