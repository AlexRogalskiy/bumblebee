export default {
  computed: {
    useKernel () {
      return this.$route.query.kernel=='1'
    },
    appStable () {
      return this.$route.query.stable=='1'
    },
  }
}