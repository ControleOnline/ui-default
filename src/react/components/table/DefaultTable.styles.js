import {StyleSheet} from 'react-native';
import tableStyleGroup1 from './DefaultTable.styleGroup1';
import tableStyleGroup2 from './DefaultTable.styleGroup2';
import tableStyleGroup3 from './DefaultTable.styleGroup3';
const styles = StyleSheet.create({...tableStyleGroup1, ...tableStyleGroup2, ...tableStyleGroup3});
export default styles;
