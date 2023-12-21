const swaggerDoc = {
    "openapi": "3.0.3",
    "info": {
        "title": "Swagger Relfinder Reformed - OpenAPI 3.0",
        "description": "This is a swagger made for the usage of the Relfinder Reformed API. \nThis API allows you to find the relations between two entities of RDF graphs contained in a database (meaning we are finding paths)\n\nIf you are on this documentation in hope for a setup guide or for an explanation on how it works, you might want to see the README file on the [project's repository](https://github.com/WoodenMaiden/RelfinderReformedAPI)",
        "contact": {
            "email": "yann.pomie@ird.fr"
        },
        "license": {
            "name": "MIT License",
            "url": "https://github.com/WoodenMaiden/RelfinderReformedAPI/blob/master/LICENSE"
        },
        "version": "1.0.0"
    },
    "externalDocs": {
        "description": "Graphology JS, Guillaume Plique. (2021). Graphology, a robust and multipurpose Graph object for JavaScript. Zenodo. https://doi.org/10.5281/zenodo.5681257",
        "url": "https://graphology.github.io/"
    },
    "tags": [
        {
            "name": "util",
            "description": "Utilities for API monitoring"
        },
        {
            "name": "relfinder",
            "description": "Operations available"
        }
    ],
    "paths": {
        "/": {
            "get": {
                "tags": [
                    "util"
                ],
                "summary": "Ping the API",
                "operationId": "ping",
                "responses": {
                    "204": {
                        "description": "Successful ping"
                    }
                }
            }
        },
        "/health": {
            "get": {
                "tags": [
                "util"
                ],
                "summary": "Get API stats",
                "description": "Checks wether API is up, returns the version, the ressource usage, the uptime, the query time for sparql endpoint and optionnal SQL database",
                "operationId": "health",
                "responses": {
                    "200": {
                        "description": "Returned metrics",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/APIHealth"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/relfinder/{depth}": {
            "post": {
                "tags": [
                    "relfinder"
                ],
                "summary": "Finds relations between at least 2 entities",
                "operationId": "relfinder",
                "parameters": [
                    {
                        "name": "depth",
                        "in": "path",
                        "description": "maw depth for relation detection",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "format": "uint"
                        }
                    }
                ],
                "requestBody": {
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "nodes": {
                                        "$ref": "#/components/schemas/EntitiesArray"
                                    }
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "successful operation",
                        "content": {
                            "application/json": {
                                "schema": {
                                "type": "object",
                                    "properties": {
                                        "nodes": {
                                            "$ref": "#/components/schemas/GraphologyNode"
                                        },
                                        "edges": {
                                            "$ref": "#/components/schemas/GraphologyEdge"
                                        },
                                        "oprions": {
                                            "$ref": "#/components/schemas/GraphologyOptions"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "404": {
                        "description": "Invalid Entities supplied",
                        "content": {
                            "application/json": {
                                "schema": {
                                "type": "array",
                                "items": {
                                    "$ref": "#/components/schemas/RFRError"
                                }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/label": {
            "post": {
                "tags": [
                    "relfinder"
                ],
                "summary": "Get suggestions of labels from what's given",
                "operationId": "label",
                "requestBody": {
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "node": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    }
                },
                "responses": {
                "200": {
                    "description": "successful operation",
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "array",
                                "items": {
                                    "$ref": "#/components/schemas/Label"
                                }
                            }
                        }
                    }
                },
                "400": {
                    "description": "Malformed request"
                },
                "500": {
                    "description": "Internal error"
                }
                }
            }
        }
    },
    "components": {
        "schemas": {
        "APIHealth": {
            "type": "object",
            "required": [
                "message",
                "APIVersion",
                "endpoint",
                "ressources",
                "uptime",
                "calculatedStart"
            ],
            "properties": {
                "message": {
                    "type": "string"
                },
                "APIVersion": {
                    "type": "string"
                },
                "endpoint": {
                    "type": "integer",
                    "format": "int64",
                    "minimum": -1
                },
                "labelStore": {
                    "type": "integer",
                    "format": "int64",
                    "minimum": -1
                },
                "ressources": {
                    "$ref": "#/components/schemas/RessourceUsage"
                },
                "uptime": {
                    "type": "string"
                },
                "calculatedStart": {
                    "type": "string",
                    "format": "date-time"
                }
            }
        },
        "RessourceUsage": {
            "type": "object",
            "properties": {
                "cpu": {
                    "$ref": "#/components/schemas/CPUUsage"
                },
                "memory": {
                    "$ref": "#/components/schemas/MemUsage"
                }
            }
        },
        "CPUUsage": {
            "type": "object",
            "properties": {
                "max": {
                    "$ref": "#/components/schemas/CPUUsageData"
                },
                "current": {
                    "$ref": "#/components/schemas/CPUUsageData"
                }
            }
        },
        "CPUUsageData": {
            "type": "object",
            "properties": {
                "user": {
                    "type": "integer",
                    "format": "int64"
                },
                "system": {
                    "type": "integer",
                    "format": "int64"
                }
            }
        },
        "MemUsage": {
            "type": "object",
            "properties": {
                "max": {
                    "type": "integer",
                    "format": "int64"
                },
                "current": {
                    "type": "integer",
                    "format": "int64"
                }
            }
        },
        "Node": {
            "type": "string",
            "format": "uri"
        },
        "EntitiesArray": {
            "type": "array",
            "items": {
                "$ref": "#/components/schemas/Node"
            }
        },
        "Label": {
            "type": "object",
            "properties": {
                "s": {
                    "$ref": "#/components/schemas/RDFEntity"
                },
                "label": {
                    "$ref": "#/components/schemas/RDFLitteral"
                }
            }
        },
        "RDFEntity": {
            "type": "object",
            "properties": {
                "value": {
                    "type": "string",
                    "format": "uri"
                }
            }
        },
        "RDFLitteral": {
            "type": "object",
            "properties": {
                "value": {
                    "oneOf": [
                        {
                            "type": "string"
                        },
                        {
                            "type": "number"
                        },
                        {
                            "type": "boolean"
                        }
                    ]
                },
                "datatype": {
                    "$ref": "#/components/schemas/RDFEntity"
                },
                "language": {
                    "type": "string"
                }
            }
        },
        "GraphologyNode": {
            "type": "object",
                "properties": {
                "key": {
                    "type": "string"
                }
            }
        },
        "GraphologyEdge": {
            "type": "object",
            "properties": {
                "key": {
                    "type": "string"
                },
                "source": {
                    "type": "string",
                    "format": "uri"
                },
                "target": {
                    "type": "string"
                },
                "attributes": {
                    "type": "object",
                    "properties": {
                        "value": {
                            "type": "string",
                            "format": "uri"
                        }
                    }
                }
            }
        },
        "GraphologyOptions": {
            "type": "object",
            "properties": {
                "type": {
                    "type": "string"
                },
                "multi": {
                    "type": "boolean"
                },
                "allowSelfLoops": {
                    "type": "boolean"
                }
            }
        },
        "RFRError": {
            "type": "object",
            "properties": {
                    "message": {
                        "type": "string"
                    },
                    "dt": {
                        "type": "object"
                    }
                }
            }
        }
    }
};

export default swaggerDoc