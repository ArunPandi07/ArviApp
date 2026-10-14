// navigation/types.ts
export type RootStackParamList = {
  Splash:        undefined;
  Language:      undefined;
  Login:         undefined;
  MainTabs:      undefined;
  NewBill:       undefined;
  BillDetail:    { billId: string };
  VoiceBilling:  undefined;
  Invoice:       { billId: string };
};

export type MainTabParamList = {
  HomeTab:      undefined;
  BillsTab:     undefined;
  InventoryTab: undefined;
  CustomersTab: undefined;
  SettingsTab:  undefined;
};
