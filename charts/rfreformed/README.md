# RelRinderReformed

A Typescript re-implementation of RelFinder: A tool to show relations between entities in a RDF gnowledge graph.

## Introduction

This chart bootstraps a RelfinderReformed deployment on a [Kubernetes](https://kubernetes.io) cluster using the [Helm](https://helm.sh) package manager.

## Prerequisites

- Kubernetes 1.23+
- Helm 3.8.0+
- PV provisioner support in the underlying infrastructure if you plan on using a label store

## Installing the Chart

To install a release run the following command:

```console
helm repo add rfreformed https://woodenmaiden.github.io/RelfinderReformedAPI
helm repo update
helm install my-release rfreformed/rfreformed
```

To customize your release head into the [Parameters](#parameters) section lists the parameters that can be configured during installation.

> [!Tip]
> List all releases you deployed using `helm list`

## Uninstalling the Chart

To uninstall/delete the `my-release` release:

```console
helm delete my-release
```

The command removes all the Kubernetes components associated with the chart and deletes the release. Remove also the chart using `--purge` option:

```console
helm delete --purge my-release
```

## Parameters

### Docker image

|        Name        |                 Description                  |                    Value                    |
| :----------------: | :------------------------------------------: | :-----------------------------------------: |
| `image.repository` |               Image repository               | `ghcr.io/woodenmaiden/relfinderreformedapi` |
| `image.pullPolicy` |              Image pull policy               |               `IfNotPresent`                |
|    `image.tag`     | Image tag (defaults to chart's `appVersion`) |                  `latest`                   |

### Sparql

|                 Name                 |                 Description                 |       Value       |
| :----------------------------------: | :-----------------------------------------: | :---------------: |
|     `sparqlConfig.sparqlAddress`     |             SPARQL endpoint URL             | `https://someurl` |
|    `sparqlConfig.includedGraphs`     | List of SPARQL graphs to include in queries |       `[]`        |
|  `sparqlConfig.exclusions.classes`   |   SPARQL classes to exclude from queries    |       `[]`        |
| `sparqlConfig.exclusions.namespaces` |  SPARQL namespaces to exclude from queries  |       `[]`        |

### API

|         Name         |              Description              |  Value  |
| :------------------: | :-----------------------------------: | :-----: |
|   `apiConfig.port`   | Port for the API service to listen on |  `80`   |
| `apiConfig.logLevel` |       Logging level of the API        | `error` |
|  `apiConfig.prefix`  |        Path Prefix for the api        |  `api`  |

### Label store

|           Name            |                       Description                        |  Value  |
| :-----------------------: | :------------------------------------------------------: | :-----: |
|   `labelStore.enabled`    |            Flag to use external label storage            | `false` |
|  `labelStore.config.url`  | Connection URL for the external label storage connection |  `''`   |
| `labelStore.config.token` |        Auth token for the external label storage         |  `''`   |

### Ingress/Egress/Networking

|         Name          |             Description             |                                                 Value                                                  |
| :-------------------: | :---------------------------------: | :----------------------------------------------------------------------------------------------------: |
|   `ingress.enabled`   | Enable ingress controller resource  |                                                 `true`                                                 |
|  `ingress.className`  |         Ingress class name          |                                                  `''`                                                  |
| `ingress.annotations` |     Annotations for the ingress     |                                                  `{}`                                                  |
|    `ingress.hosts`    | Hosts configuration for the ingress | `[{"host": "api.127.0.0.1.sslip.io", "paths": [{"path": "/", "pathType": "ImplementationSpecific"}]}]` |
|     `ingress.tls`     |  TLS configuration for the ingress  |                                                  `[]`                                                  |
|   `egress.enabled`    |         Enable egress rules         |                                                `false`                                                 |
|    `service.type`     |       Kubernetes Service type       |                                              `ClusterIP`                                               |

### Autoscaling

|                     Name                     |             Description             | Value  |
| :------------------------------------------: | :---------------------------------: | :----: |
|                 `resources`                  | CPU/Memory resource requests/limits |  `{}`  |
|                `replicaCount`                |    Number of replicas to deploy     |  `1`   |
|            `autoscaling.enabled`             |         Enable autoscaling          | `true` |
|          `autoscaling.minReplicas`           |     Minimum number of replicas      |  `1`   |
|          `autoscaling.maxReplicas`           |     Maximum number of replicas      |  `10`  |
| `autoscaling.targetCPUUtilizationPercentage` |  Target CPU utilization percentage  |  `80`  |

### Probes

|            Name            |       Description        |   Value   |
| :------------------------: | :----------------------: | :-------: |
| `probes.readiness.enabled` |  Enable readiness probe  |  `true`   |
|  `probes.readiness.path`   | Path for readiness probe | `/health` |
| `probes.liveness.enabled`  |  Enable liveness probe   |  `true`   |
|   `probes.liveness.path`   | Path for liveness probe  | `/health` |

### Misc

|        Name        |                   Description                    |  Value  |
| :----------------: | :----------------------------------------------: | :-----: |
|   `nameOverride`   |              Override the app name               |  `''`   |
| `fullnameOverride` |       Override the full name of the chart        | `'api'` |
| `imagePullSecrets` | Specify docker-registry secret names as an array |  `[]`   |
|   `nodeSelector`   |          Node labels for pod assignment          |  `{}`   |
|   `tolerations`    |         List of node taints to tolerate          |  `[]`   |

### Change version

To modify the version used in this chart you can specify a [valid image tag](https://github.com/WoodenMaiden/RelfinderReformedAPI/pkgs/container/relfinderreformedapi) using the `image.tag` parameter. For example, `image.tag=X.Y.Z`. This approach is also applicable to other images like exporters.

### Setting Pod's affinity

This chart allows you to set your custom affinity using the `XXX.affinity` parameter(s). Find more information about Pod's affinity in the [kubernetes documentation](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#affinity-and-anti-affinity).

## License

MIT License

Copyright (c) 2022 Yann POMIE

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
