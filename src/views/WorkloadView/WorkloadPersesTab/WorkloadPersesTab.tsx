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
  
  buildProxyUrl(): string {
    return "/perses";
  }
}

export const fakeDatasourceApi = new DatasourceApiImpl();

const fakeDatasource1: GlobalDatasource = {
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

const fakeDatasource: GlobalDatasource = {
  kind: "GlobalDatasource",
  metadata: {
    name: "fake-datasource",
    createdAt: "2024-07-17T11:32:41.925800718Z",
    updatedAt: "2024-07-19T13:23:53.410325637Z",
    version: 2,
  },
  spec: {
    display: {},
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
            headers: {
              Authorization: `Bearer ${token}`, // reach out to me via app.element.io/matrix for the token
            },
          },
        },
      },
    },
  },
};

const fakeDashboard: DashboardResource = {
  "kind": "Dashboard",
  "metadata": {
    "name": "test_dash",
    "project": "test_project",
  },
  "spec": {
    "variables": [],
    "duration": "30m",
    "panels": {
      "MemoryUsagebyPod": {
        "kind": "Panel",
        "spec": {
          "display": {
            "name": "Memory Usage by Pod"
          },
          "plugin": {
            "kind": "TimeSeriesChart",
            "spec": {
              "yAxis": {
                "show": true,
                "label": "",
                "format": {
                  "unit": "percent"
                },
                "min": 0,
                "max": 100
              },
              "visual": {
                "lineWidth": 1.5,
                "areaOpacity": 0.05,
                "stack": "all"
              }
            }
          },
          "queries": [
            {
              "kind": "TimeSeriesQuery",
              "spec": {
                "plugin": {
                  "kind": "PrometheusTimeSeriesQuery",
                  "spec": {
                    "datasource": {
                      "kind": "PrometheusDatasource",
                      "name": "EntigoDatasource"
                    },
                    "query": "(sum(container_memory_working_set_bytes{namespace=~'.*', pod=~'test-kk-8c985c758-xgrd7', container=~'.*'}) / \n sum(kube_pod_container_resource_limits{namespace=~'.*', resource='memory', pod=~'test-kk-8c985c758-xgrd7', container=~'.*'})) * 100"
                  }
                }
              }
            }
          ]
        }
      }
    },
    "layouts": [
      {
        "kind": "Grid",
        "spec": {
          "items": [
            {
              "x": 0,
              "y": 0,
              "width": 24,
              "height": 7,
              "content": {
                "$ref": "#/spec/panels/MemoryUsagebyPod"
              }
            }
          ]
        }
      }
    ]
  }
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
