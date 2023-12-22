# Relfinder Reformed API 

## What does it do ?
This APi is here to replace (Relfinder)[https://github.com/VisualDataWeb/RelFinder].
It queries the graphs from a RDF database, in order to show relations between two RDF entities.

## How does it work ?
When a request is sent on the ``/relfinder/{depth}``, the API fetches a subgraph from the database. It then applies the Kosaraju Algorithm and factorize all the Strongly Connected Components (SCCs) into a single node, this helps on larger graphs. Finally a pathfinding algorithm runs to find a path between the two entities.
![steps of RFR](/img/schema_rfr_api.png)

More info on the [http://localhost:8080/docs](http://localhost:8080/docs) endpoint.

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
docker pull ghcr.io/woodenmaiden/relfinderreformedapi:latest
docker run [-e ENV_VARS=values] relfinder_reformed [url] [CLI options]
```

## Env variables
<!-- |Option|Type|Description|Default value|
|-|-|-|-|
|url|string(url)|Address of SPARQL endpoint (Required)||
|`-c` `--check-connection`|`none` `strict` `no-crash`|checks is the endpoint is reachable at startup, crashes if `strict` is used|`none`|
|`-l` `--logs`|string[]|Files to write logs into|/dev/stdout|
|`--loglevel`|`FATAL` `ERROR` `WARN` `INFO` `DEBUG` `DEBUG`|Log level|`INFO`|
|`-p` `--port`|integer|Port to listen on|8080|
|`--included-graphs`|string[]|Defines graphs to select from in queries||
|`--included-classes`|string[]|Defines classes to select from in queries||
|`--included-namespaces`|string[]|Defines namespaces to select from in queries||
|`--excluded-classes`|string[]|Defines classes to exclude from in queries||
|`--excluded-namespaces`|string[]|Defines namespaces to exclude from in queries||
|`--label-store-URL`|string|An optionnal connection URL to a database storing labels. This comes in handy in larger datasets||
|`--label-store-token`|string|An API token to use to connect to the label store if needed (ElasticSearch for instance)||

> ⚠️ Environment variables will override and take priority over CLI arguments
## Env variables
|Variable|
|-|
|SPARQL_ADDRESS|
|LABEL_STORE_URL|
|LABEL_STORE_TOKEN|
|INCLUDED_CLASSES|
|EXCLUDED_CLASSES|
|INCLUDED_GRAPHS|
|INCLUDED_NAMESPACES|
|EXCLUDED_NAMESPACES| -->

# Label stores

You might want users to have an URI from a label as they might not know URIS. However as your dataset gets larger and larger you would like to keep this extra query quick. This is where label stores come in handy.

By default, if none is provided via the ``label-store-URL`` option or it's corresponding environment variable, the API will query the entire triplestore to find URI's from a label. This is not efficient and can be slow on large datasets.
A label store is a database in which you store your labels and their corresponding URI's. This allows to gain time when querying for labels, and it weight off load on your triplestore. 

## Supported databases

Since the amount of text to pe processed is still large, you might want to use a dedicated database implementing full text search.
Supported databases are:

Relationnal databases supported by [Sequelize](https://sequelize.org/): 
- MariaDB
- MySQL
- PostgreSQL

An others like:
- ElasticSearch

[Here is a nice video to explain what full text search is](https://youtu.be/ajNfOPeWiAY)

### Relationnal databases

The table `labels` will contain both the label and the URI. Sequelize automatically creates the table if it does not exists.

However, concrete implementation will change between DBMS.

#### MariaDB / MySQL

```sql
-- The full text search happens thanks to the MATCH() AGAINST() function...
CREATE TABLE labels (
  -- ... however MariaDB/MySQL cannot have a text column as a Primary key as it must have a length
  -- So we use a char(36) column as a primary key
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `label` text NOT NULL,
  `uri` text NOT NULL,
  PRIMARY KEY (`id`),
  FULLTEXT KEY `FT_SEARCH` (`label`,`uri`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

#### PostgreSQL

```sql
-- How this works: https://bigmachine.io/2022/06/12/creating-a-full-text-search-engine-in-postgresql-2022/

-- The search column is a generated column that contains the concatenation of the label and the uri, and is indexed using a GIN index.
-- Every time we query with full-text-search, search column is used.
CREATE TABLE labels (
  "label" text NOT NULL,
  uri text NOT NULL,
  "search" TSVECTOR NULL GENERATED ALWAYS AS (to_tsvector('english'::regconfig, (label || ' '::text) || uri)) STORED,
  CONSTRAINT labels_pkey PRIMARY KEY (label, uri)
);
CREATE INDEX "IDX_SEARCH" ON public.labels USING gin (search);
```

### Other databases

#### ElasticSearch

Here is the mapping you should put in the `labels` index:

```json
{
  "mappings": {
    "properties": {
      "label": {
        "type": "text"
      },
      "uri": {
        "type": "text"
      }
    }
  }
}
```

> [!NOTE]
> In ES queries, label get double the score of uri. This is to make sure that if a label is present in the database, it will be returned first.