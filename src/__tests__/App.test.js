import React from "react";
import { render, fireEvent, waitForElement, screen } from "@testing-library/react";
//import { render, fireEvent } from '../test-utils'
import TickerTable from "../App";

test('shows that UI components were loaded', () => {
  render(<TickerTable></TickerTable>)
  expect(screen.queryByText('ON')).not.toBeNull()
  expect(screen.queryByText('Change')).not.toBeNull()
  expect(screen.queryByText('Volume', {selector: 'label'})).not.toBeNull()
  expect(screen.queryByText('Volume', {selector: 'div'})).not.toBeNull()
  expect(screen.queryByText('Pair')).not.toBeNull()
  expect(screen.queryByText('Last Price')).not.toBeNull()
})