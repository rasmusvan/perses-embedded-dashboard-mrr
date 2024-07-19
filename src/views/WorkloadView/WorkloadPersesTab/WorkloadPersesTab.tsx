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
import {
  TimeRangeProvider,
  PluginRegistry,
  PluginModuleResource,
  dynamicImportPluginLoader,
} from "@perses-dev/plugin-system";
import prometheusResource from "@perses-dev/prometheus-plugin/plugin.json";
import panelsResource from "@perses-dev/panels-plugin/plugin.json";

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

const fakeDatasource1: GlobalDatasource = {
  kind: "GlobalDatasource",
  metadata: {
    name: "fake-datasource",
  },
  spec: {
    display: {
      name: "Fake datasource",
    },
    default: true,
    plugin: {
      kind: "PrometheusDatasource",
      spec: {
        proxy: {
          kind: "HTTPProxy",
          spec: {
            allowedEndpoints: [
              {
                endpointPattern: "/api/v1/labels",
                method: "POST",
              },
              {
                endpointPattern: "/api/v1/series",
                method: "POST",
              },
              {
                endpointPattern: "/api/v1/metadata",
                method: "GET",
              },
              {
                endpointPattern: "/api/v1/query",
                method: "POST",
              },
              {
                endpointPattern: "/api/v1/query_range",
                method: "POST",
              },
              {
                endpointPattern: "/api/v1/label/([a-zA-Z0-9_-]+)/values",
                method: "GET",
              },
            ],
            url: "https://prometheus.demo.do.prometheus.io",
          },
        },
        scrapeInterval: "15s",
      },
    },
  },
};

const fakeDashboard: DashboardResource = {
  kind: "Dashboard",
  metadata: {
    name: "aaaaa",
    project: "rasmus-en",
    createdAt: "2024-07-11T13:26:14.424469171Z",
    updatedAt: "2024-07-11T13:26:14.424469171Z",
    version: 0,
  },
  spec: {
    duration: "1h",
    variables: [],
    display: {
      name: "aaaaa",
    },
    panels: {
      Test: {
        kind: "Panel",
        spec: {
          display: {
            name: "Test",
          },
          plugin: {
            kind: "TimeSeriesChart",
            spec: {},
          },
          queries: [
            {
              kind: "TimeSeriesQuery",
              spec: {
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
          ],
        },
      },
    },
    layouts: [
      {
        kind: "Grid",
        spec: {
          display: {
            title: "Panel Group",
            collapse: {
              open: true,
            },
          },
          items: [
            {
              x: 0,
              y: 0,
              width: 24,
              height: 10,
              content: {
                $ref: "#/spec/panels/Test",
              },
            },
          ],
        },
      },
    ],
  },
};

const dashboardStoreProps: DashboardStoreProps = {
  dashboardResource: fakeDashboard,
};

export const WorkloadPersesTab: React.FC = () => {
  const muiTheme = getTheme("dark");
  const chartsTheme = generateChartsTheme(muiTheme, {});

  const boxProps: BoxProps = {
    alignItems: "center",
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

  const pluginLoader = dynamicImportPluginLoader([
    {
      resource: prometheusResource as PluginModuleResource,
      importPlugin: () => import("@perses-dev/prometheus-plugin"),
    },
    {
      resource: panelsResource as PluginModuleResource,
      importPlugin: () => import("@perses-dev/panels-plugin"),
    },
  ]);

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
                  <PluginRegistry
                    pluginLoader={pluginLoader}
                    defaultPluginKinds={{
                      Panel: "TimeSeriesChart",
                      TimeSeriesQuery: "PrometheusTimeSeriesQuery",
                    }}
                  >
                    <DatasourceStoreProvider
                      dashboardResource={fakeDashboard}
                      datasourceApi={fakeDatasourceApi}
                    >
                      <DashboardProvider {...dashboardProviderProps}>
                        <Dashboard {...dashboardProps} />
                      </DashboardProvider>
                    </DatasourceStoreProvider>
                  </PluginRegistry>
                </TemplateVariableProvider>
              </TimeRangeProvider>
            </QueryClientProvider>
          </SnackbarProvider>
        </ChartsProvider>
      </ThemeProvider>
    </>
  );
};
