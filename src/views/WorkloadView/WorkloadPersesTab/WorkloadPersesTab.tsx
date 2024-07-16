import React from "react";
import {
  ChartsProvider,
  getTheme,
  generateChartsTheme,
  SnackbarProvider,
} from "@perses-dev/components";
import {
  GlobalDatasource,
  ProjectDatasource,
  DashboardResource,
} from "@perses-dev/core";
import { ThemeProvider, BoxProps } from "@mui/material";
import {
  Dashboard,
  DashboardProps,
  DashboardProvider,
  DashboardProviderProps,
  DashboardStoreProps,
  DatasourceApi,
  DatasourceStoreProvider,
  TemplateVariableProvider,
} from "@perses-dev/dashboards";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TimeRangeProvider } from "@perses-dev/plugin-system";

class DatasourceApiImpl implements DatasourceApi {
  getDatasource(): Promise<ProjectDatasource | undefined> {
    return Promise.resolve(undefined);
  }

  getGlobalDatasource(): Promise<GlobalDatasource | undefined> {
    return Promise.resolve(fakeDatasource);
  }

  listDatasources(): Promise<ProjectDatasource[]> {
    return Promise.resolve([]);
  }

  listGlobalDatasources(): Promise<GlobalDatasource[]> {
    return Promise.resolve([fakeDatasource]);
  }
}

export const fakeDatasourceApi = new DatasourceApiImpl();

const fakeDatasource: GlobalDatasource = {
  kind: "GlobalDatasource",
  metadata: { name: "fake-datasource" },
  spec: {
    default: true,
    plugin: {
      kind: "PrometheusDatasource",
      spec: {
        directUrl: "https://prometheus.demo.do.prometheus.io",
      },
    },
  },
};

const fakeDashboard: DashboardResource = {
  kind: "Dashboard",
  metadata: {
    name: "test-dash",
    project: "rasmus-en",
  },
  spec: {
    duration: "4m",
    variables: [],
    layouts: [
      {
        kind: "Grid",
        spec: {
          items: [
            {
              x: 0,
              y: 0,
              width: 6,
              height: 6,
              content: {
                $ref: "#/spec/panels/test",
              },
            },
          ],
        },
      },
    ],
    panels: {
      Test1: {
        kind: "Panel",
        spec: {
          display: {
            name: "test-panel",
          },
          plugin: {
            kind: "PrometheusTimeSeriesQuery",
            spec: {
              datasource: {
                kind: "PrometheusDatasource",
                name: "fake-datasource",
              },
              query: "container_cpu_usage_seconds_total",
            },
          },
        },
      },
    },
  },
};

const dashboardStoreProps: DashboardStoreProps = {
  dashboardResource: fakeDashboard,
};

export const WorkloadPersesTab: React.FC = ({}) => {
  const muiTheme = getTheme("dark");
  const chartsTheme = generateChartsTheme(muiTheme, {});

  const boxProps: BoxProps = {
    height: 200,
    width: 200,
    my: 4,
    display: "flex",
    alignItems: "center",
    gap: 4,
    p: 2,
    sx: { border: "2px solid grey" },
  };

  const dashboardProps: DashboardProps = {
    emptyDashboardProps: {
      title: "No Data",
      description: "No data available for the selected workload.",
      additionalText: "Please check the configuration or try again later.",
      actions: false,
    },
    panelOptions: {
      hideHeader: false,
    },
    ...boxProps,
  };

  const dashboardProviderProps: DashboardProviderProps = {
    initialState: dashboardStoreProps,
  };

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 0,
      },
    },
  });

  return (
    <>
      <ThemeProvider theme={muiTheme}>
        <ChartsProvider chartsTheme={chartsTheme} enablePinning={true}>
          <SnackbarProvider
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            variant="default"
            content=""
          >
            <QueryClientProvider client={queryClient}>
              <TimeRangeProvider
                refreshInterval="0s"
                timeRange={{ pastDuration: "30m" }}
              >
                <TemplateVariableProvider>
                  <DatasourceStoreProvider
                    dashboardResource={fakeDashboard}
                    datasourceApi={fakeDatasourceApi}
                  >
                    <DashboardProvider {...dashboardProviderProps}>
                      <Dashboard {...dashboardProps} />
                    </DashboardProvider>
                  </DatasourceStoreProvider>
                </TemplateVariableProvider>
              </TimeRangeProvider>
            </QueryClientProvider>
          </SnackbarProvider>
        </ChartsProvider>
      </ThemeProvider>
    </>
  );
};
