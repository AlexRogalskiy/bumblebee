#{payload.optimusPath}
#{this.initJSON}
#{this.initVariables}
#{this.measureTime ? this.timeStart : ""}

coiled_available = False
spark_available = False
coiled_gpu_available = False
rapids_available = False

try:
    import pyspark
    spark_available = True
except:
    spark_available = False

try:
    import coiled
    coiled_available = True
except:
    coiled_available = False

try:
    import dask
    import cudf
    import dask_cudf
    rapids_available = True
except:
    rapids_available = False

coiled_gpu_available = coiled_available

res = { "coiled_available": coiled_available, "coiled_gpu_available": coiled_gpu_available, "spark_available": spark_available, "rapids_available": rapids_available }

# optimus reserved words

try:
    from optimus.expressions import reserved_words
    res.update({'reserved_words': reserved_words})
except:
    pass


#{this.measureTime ? this.timeEnd : ""}
#{this.includeVariables}
#{this.outputJSON("res")}