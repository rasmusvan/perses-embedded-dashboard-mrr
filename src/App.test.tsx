import React from "react";
import { render, screen } from "@testing-library/react";
import { WorkloadPersesTab } from "./views/WorkloadView/WorkloadPersesTab/WorkloadPersesTab";
test("renders learn react link", () => {
  render(<WorkloadPersesTab />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
