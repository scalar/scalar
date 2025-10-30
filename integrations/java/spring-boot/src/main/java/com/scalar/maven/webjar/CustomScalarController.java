package com.scalar.maven.webjar;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CustomScalarController extends ScalarController {

  public CustomScalarController(ScalarProperties properties) {
    super(properties);
  }

  @Override
  protected ScalarProperties configureProperties(ScalarProperties properties, HttpServletRequest request) {
    properties.setShowOperationId(true);
    return properties;
  }
}
