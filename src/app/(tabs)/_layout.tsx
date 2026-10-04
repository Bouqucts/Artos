import { NativeTabs } from 'expo-router/unstable-native-tabs';
const tabs = [
  ['index', 'dollarsign.circle', 'dollarsign.circle.fill'],
  ['transactions', 'creditcard', 'creditcard.fill'],
  ['dashboard', 'chart.pie', 'chart.pie.fill'],
  ['report', 'doc.plaintext', 'doc.plaintext.fill'],
  ['settings', 'gearshape', 'gearshape.fill'],
] as const;

export default function MainTabsLayout() {
  return (
    <NativeTabs iconColor={{ default: '#52616e', selected: '#247ab9' }}>
      {tabs.map(([name, icon, selectedIcon]) => (
        <NativeTabs.Trigger name={name} key={name}>
          <NativeTabs.Trigger.Icon sf={{ default: icon, selected: selectedIcon }} />
          <NativeTabs.Trigger.Label hidden />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
