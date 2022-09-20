# Relfinder Reformed API 

## What does it do ?
This APi is here to replace (Relfinder)[https://github.com/VisualDataWeb/RelFinder].
It queries the graphs from a RDF database, in order to show relations between two RDF entities.

## How does it work ?
When a request is sent on the ``/relfinder/{depth}``, the API fetches a subgraph from the database. It then applies the Kosaraju Algorithm and factorize all the Strongly Connected Components (SCCs) into a single node, this helps on larger graphs. Finally a pathfinding algorithm runs to find a path between the two entities.
![steps of RFR](/img/schema_rfr_api.png)

# Setup

## Usage

```sh
node . [url] [CLI options]
```
or 
```sh
export ENV_VARIABLE=somevalue
export ENV_VARIABLE2=somevalue
export ENV_VARIABLE3=somevalue
...
node . [url]
```

with Dockerfile
```sh
docker build . -t relfinder_reformed
docker run relfinder_reformed [url] [CLI options]
```

## CLI options
|Option|Type|Description|Default value|
|-|-|-|-|
|url|string(url)|Address of SPARQL endpoint (Required)||
|`-c` `--check-connection`|`none` `strict` `no-crash`|checks is the endpoint is reachable at startup, crashes if `strict` is used|`none`|
|`-l` `--logs`|string[]|Files to write logs into|/dev/stdout|
|`--loglevel`|`FATAL` `ERROR` `WARN` `INFO` `DEBUG` `DEBUG`|Log level|`INFO`|
|`-p` `--port`|integer|Port to listen on|8080|
|`included-graphs`|string[]|Defines graphs to select from in queries||
|`included-classes`|string[]|Defines classes to select from in queries||
|`included-namespaces`|string[]|Defines namespaces to select from in queries||
|`excluded-classes`|string[]|Defines classes to exclude from in queries||
|`excluded-namespaces`|string[]|Defines namespaces to exclude from in queries||
|`postgres-connection-url`|string[]|An optionnal connection URL to a Postgres database, used to store labels. This comes in handy in larger datasets||

Environment variables will override and take priority over CLI arguments
## Env variables
|Variable|
|-|
|SPARQL_ADDRESS|
|POSTGRES_URL|
|INCLUDED_CLASSES|
|EXCLUDED_CLASSES|
|INCLUDED_GRAPHS|
|INCLUDED_NAMESPACES|
|EXCLUDED_NAMESPACES|