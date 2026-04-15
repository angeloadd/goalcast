import io.mockk.junit5.MockKExtension
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.test.context.ActiveProfiles

@ActiveProfiles("testing")
@ExtendWith(MockKExtension::class)
@MockKExtension.CheckUnnecessaryStub
@SpringBootTest
@AutoConfigureMockMvc
class BaseIntegrationTest
