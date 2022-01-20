# Create a View
class TestView(View):
    def get(self, request):
        return HttpResponse("Hello, world. You're at the test view.")

# Create a URL
urlpatterns = [
    url(r'^$', TestView.as_view(), name='test'),
]

# 

