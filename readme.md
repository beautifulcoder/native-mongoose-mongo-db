# Performance Benchmarks Between Mongoose vs Native in MongoDB

These benchmarks came from [Apace Benchmark](http://httpd.apache.org/docs/current/programs/ab.html).


```shell script
ab -n 150 -c 4 -H "Content-Type:application/json" http://localhost:3001/5fa548f96a69652a4c80e70d
ab -n 150 -c 4 -H "Content-Type:application/json" http://localhost:3002/5fa5492d6a69652a4c80e70e

ab -n 150 -c 4 -T "application/json" -u .putdata http://localhost:3001/5fa548f96a69652a4c80e70d
ab -n 150 -c 4 -T "application/json" -u .putdata http://localhost:3002/5fa5492d6a69652a4c80e70e
```

|    READS    | Native     | Mongoose  |
--------------|------------|------------
| Throughput  | 1200 #/sec | 583 #/sec |
| Avg Request | 0.83 ms    | 1.71 ms   |

|   WRITES    | Native     | Mongoose  |
--------------|------------|------------
| Throughput  | 1128 #/sec | 384 #/sec |
| Avg Request | 0.89 ms    | 2.60 ms   |
